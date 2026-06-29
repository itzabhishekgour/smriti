#!/usr/bin/env node

import { Command } from 'commander';
import { prompt, saveToken, clearToken } from './auth.js';
import { createApi, publicApi } from './api.js';
import { spawn } from 'child_process';

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

// Catch-all to show help
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
