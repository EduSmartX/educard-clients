#!/usr/bin/env node
// Helper script to start Expo from the correct directory
const { execFileSync } = require('child_process');
const path = require('path');

const mobileDir = __dirname;
const cliBin = path.join(mobileDir, 'node_modules', 'expo', 'bin', 'cli');
const args = process.argv.slice(2);

execFileSync(process.execPath, [cliBin, ...args], {
  stdio: 'inherit',
  cwd: mobileDir,
  env: { ...process.env, NODE_PATH: path.join(mobileDir, 'node_modules') },
});
