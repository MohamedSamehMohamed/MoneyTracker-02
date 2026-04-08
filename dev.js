#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function spawnProcess(name, command, cwd, color) {
  const proc = spawn(command, {
    shell: true,
    cwd,
    stdio: 'inherit'
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]${colors.reset} Exited with code ${code}`);
  });

  return proc;
}

console.log(`${colors.blue}Starting MoneyTracker Development Environment${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

const rootDir = __dirname;

const server = spawnProcess(
  'Server',
  'npm run dev',
  path.join(rootDir, 'server'),
  colors.blue
);

const client = spawnProcess(
  'Client',
  'npm run dev',
  path.join(rootDir, 'client'),
  colors.green
);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down all processes...${colors.reset}`);
  server.kill('SIGINT');
  client.kill('SIGINT');
  process.exit(0);
});

// Wait for either process to exit
Promise.all([
  new Promise(resolve => server.on('exit', resolve)),
  new Promise(resolve => client.on('exit', resolve))
]).then(() => {
  console.log(`${colors.yellow}One process has exited. Shutting down the other...${colors.reset}`);
  server.kill('SIGTERM');
  client.kill('SIGTERM');
  process.exit(1);
});
