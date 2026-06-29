import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { execSync } from 'child_process';

const CONFIG_DIR = path.join(os.homedir(), '.smriti');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getToken() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return data.token;
  } catch (err) {
    return null;
  }
}

export function saveToken(token) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }, null, 2), { mode: 0o600 });

  if (process.platform === 'win32') {
    try {
      const username = os.userInfo().username;
      // Remove inheritance and grant Full Control to the current user
      execSync(`icacls "${CONFIG_FILE}" /inheritance:r /grant:r "${username}":F`, { stdio: 'ignore' });
    } catch (err) {
      console.warn('Warning: could not fully restrict config file permissions on this system.');
    }
  }
}

export function clearToken() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

export function prompt(query, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (hidden) {
    rl.stdoutMuted = true;
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) {
        // If it's a newline, let it pass so the prompt moves down
        if (stringToWrite === '\r\n' || stringToWrite === '\n') {
          rl.output.write(stringToWrite);
        }
      } else {
        rl.output.write(stringToWrite);
      }
    };
  }

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}
