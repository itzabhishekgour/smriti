#!/usr/bin/env node

import { Command } from 'commander';
import { prompt, saveToken, clearToken } from './auth.js';
import { createApi, publicApi } from './api.js';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('smriti')
  .description('CLI for Smriti Secret Manager')
  .version('1.0.0');

// Helper to resolve project ID from name or ID
async function resolveProject(api, nameOrId) {
  try {
    const res = await api.get('/projects');
    const projects = res.data.data;
    
    // Check if it matches an ID exactly
    const exactIdMatch = projects.find(p => p.id === nameOrId);
    if (exactIdMatch) return exactIdMatch.id;
    
    // Check if it matches a name (case-insensitive)
    const exactNameMatch = projects.find(p => p.name.toLowerCase() === nameOrId.toLowerCase());
    if (exactNameMatch) return exactNameMatch.id;
    
    throw new Error(`Project not found: ${nameOrId}`);
  } catch (err) {
    if (err.message.includes('not found')) throw err;
    throw new Error(`Failed to resolve project: ${err.message}`);
  }
}

// FORMAT HELPER
function formatEnvValue(value) {
  if (value.includes('\n') || value.includes('"') || value.includes("'") || value.includes(' ')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

program
  .command('login')
  .description('Authenticate and store a session locally')
  .action(async () => {
    try {
      const email = await prompt('Email: ');
      const password = await prompt('Password: ', true);
      console.log(''); // newline after hidden password prompt
      
      const res = await publicApi.post('/auth/login', { email, password });
      const token = res.data.data.token;
      
      saveToken(token);
      console.log('Successfully logged in.');
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message || err.message);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Clear the locally stored session')
  .action(() => {
    clearToken();
    console.log('Logged out successfully.');
  });

program
  .command('projects')
  .description('List the user\'s projects')
  .action(async () => {
    try {
      const api = createApi();
      const res = await api.get('/projects');
      const projects = res.data.data;
      
      if (projects.length === 0) {
        console.log('No projects found.');
        return;
      }
      
      console.table(projects.map(p => ({
        Name: p.name,
        ID: p.id,
        'Role': p.userRole
      })));
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('secrets <project>')
  .description('List secret names within a project')
  .action(async (project) => {
    try {
      const api = createApi();
      const projectId = await resolveProject(api, project);
      
      const res = await api.get(`/projects/${projectId}/secrets`);
      const secrets = res.data.data;
      
      if (secrets.length === 0) {
        console.log(`No secrets found in project: ${project}`);
        return;
      }
      
      console.log(`Secrets in project: ${project}\n`);
      secrets.forEach(s => {
        console.log(`- ${s.name} (${s.environment || 'none'})`);
      });
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('pull <project>')
  .description('Output all secrets in that project in .env format to stdout')
  .action(async (project) => {
    try {
      const api = createApi();
      const projectId = await resolveProject(api, project);
      
      const res = await api.get(`/projects/${projectId}/secrets/export`);
      const secrets = res.data.data;
      
      secrets.forEach(s => {
        // Sanitize key name to be a valid env var name (alphanumeric and underscore)
        const safeKey = s.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        console.log(`${safeKey}=${formatEnvValue(s.value)}`);
      });
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('run <project>')
  .description('Fetch secrets, inject them as environment variables, then execute command')
  .argument('<command...>', 'The command and its arguments to run')
  .allowUnknownOption(true)
  .action(async (project, commandArgs) => {
    try {
      const api = createApi();
      const projectId = await resolveProject(api, project);
      
      const res = await api.get(`/projects/${projectId}/secrets/export`);
      const secrets = res.data.data;
      
      const envsToInject = {};
      secrets.forEach(s => {
        const safeKey = s.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        envsToInject[safeKey] = s.value;
      });
      
      const childEnv = { ...process.env, ...envsToInject };
      
      const [cmd, ...args] = commandArgs;
      
      const child = spawn(cmd, args, {
        stdio: 'inherit',
        env: childEnv,
        shell: true
      });
      
      child.on('exit', (code) => {
        process.exit(code !== null ? code : 1);
      });
      
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('scan <project>')
  .description('Scan staged files for secrets before committing')
  .action(async (project) => {
    try {
      const api = createApi();
      const projectId = await resolveProject(api, project);
      
      const res = await api.get(`/projects/${projectId}/secrets/export`);
      const secrets = res.data.data;
      const decryptedValues = secrets.map(s => s.value).filter(v => v.length > 5);

      // Regex patterns
      const PATTERNS = {
        'AWS_ACCESS_KEY_ID': /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        'GITHUB_TOKEN': /gh[pousr]_[a-zA-Z0-9]{36}/g,
        'STRIPE_KEY': /(?:sk_live|rk_live)_[a-zA-Z0-9]{24,99}/g,
        'PRIVATE_KEY': /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
        'GENERIC_SECRET': /(password|secret|token|api_key|apikey)[\s]*[:=][\s]*['"][a-zA-Z0-9\-_]{16,}['"]/gi
      };

      // Get staged files
      let stagedFilesStr = '';
      try {
        stagedFilesStr = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
      } catch (e) {
        console.error('Failed to get staged files. Are you in a git repository?');
        process.exit(1);
      }

      const files = stagedFilesStr.trim().split('\n').filter(Boolean);
      if (files.length === 0) {
        console.log('No files staged for commit.');
        process.exit(0);
      }

      let hasHighConfidenceFinding = false;
      let hasLowConfidenceFinding = false;

      function maskSecret(secret) {
        if (!secret || secret.length < 4) return '****';
        if (secret.length < 8) return secret.substring(0, 2) + '****';
        return secret.substring(0, 4) + '****' + secret.substring(secret.length - 4);
      }

      for (const file of files) {
        if (!fs.existsSync(file)) continue; // might have been deleted
        if (file.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|mp4|webm)$/i)) continue;

        const content = fs.readFileSync(file, 'utf-8');

        // Exact match
        for (const secretVal of decryptedValues) {
          if (content.includes(secretVal)) {
            console.error(`\x1b[31m[HIGH CONFIDENCE] Exact Smriti secret match found in ${file}\x1b[0m`);
            console.error(`  Detected value: ${maskSecret(secretVal)}`);
            hasHighConfidenceFinding = true;
          }
        }

        // Pattern match
        for (const [patternName, regex] of Object.entries(PATTERNS)) {
          let match;
          while ((match = regex.exec(content)) !== null) {
            const matchedValue = match[0];
            const isAlsoExact = decryptedValues.some(v => matchedValue.includes(v));
            if (isAlsoExact) continue; // Already reported as exact

            console.warn(`\x1b[33m[LOW CONFIDENCE] Pattern ${patternName} found in ${file}\x1b[0m`);
            console.warn(`  Detected value: ${maskSecret(matchedValue)}`);
            hasLowConfidenceFinding = true;
          }
        }
      }

      if (hasHighConfidenceFinding) {
        console.error('\n\x1b[31mCommit blocked! High confidence secrets detected.\x1b[0m');
        console.error('Please remove the secrets from the code. If this is intentional, bypass using --no-verify.');
        process.exit(1);
      } else if (hasLowConfidenceFinding) {
        console.warn('\n\x1b[33mWarning: Possible secrets detected.\x1b[0m Commit will proceed, but please review.');
      } else {
        console.log('Scan complete. No secrets detected.');
      }

    } catch (err) {
      console.error('Error running scan:', err.message);
      process.exit(1);
    }
  });

program
  .command('install-hook <project>')
  .description('Install a pre-commit git hook to automatically scan for secrets')
  .action((project) => {
    const gitHookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
    const isGitRepo = fs.existsSync(path.join(process.cwd(), '.git'));

    if (!isGitRepo) {
      console.error('Error: Not a git repository (no .git directory found).');
      process.exit(1);
    }

    const hookContent = `
# Smriti Secret Scanner
echo "Running Smriti secret scan..."
npx smriti scan "${project}"
if [ $? -ne 0 ]; then
    echo "Smriti secret scan failed! Commit blocked."
    exit 1
fi
`;

    try {
      if (fs.existsSync(gitHookPath)) {
        const existing = fs.readFileSync(gitHookPath, 'utf-8');
        if (existing.includes('smriti scan')) {
          console.log('Smriti hook already installed.');
          return;
        }
        fs.appendFileSync(gitHookPath, '\n' + hookContent);
        console.log('Appended Smriti scan to existing pre-commit hook.');
      } else {
        fs.writeFileSync(gitHookPath, '#!/bin/sh\n' + hookContent);
        fs.chmodSync(gitHookPath, '755');
        console.log('Created new pre-commit hook with Smriti scan.');
      }
    } catch (err) {
      console.error('Failed to install hook:', err.message);
      process.exit(1);
    }
  });

// Catch-all to show help
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
