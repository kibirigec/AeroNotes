#!/usr/bin/env node

console.log('=== Build Environment Debug Info ===');
console.log('Node version:', process.version);
console.log('NPM version:', process.env.npm_version || 'Unknown');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());

console.log('\n=== Checking critical dependencies ===');
const criticalDeps = [
  'next',
  '@tailwindcss/postcss',
  'tailwindcss',
  'postcss',
  'autoprefixer'
];

criticalDeps.forEach(dep => {
  try {
    const pkg = require(dep);
    console.log(`✓ ${dep}: Available`);
  } catch (error) {
    console.log(`✗ ${dep}: Missing or error - ${error.message}`);
  }
});

console.log('\n=== Checking important files ===');
const fs = require('fs');
const path = require('path');

const importantFiles = [
  'package.json',
  'postcss.config.mjs',
  'tailwind.config.js',
  'src/app/globals.css',
  'netlify.toml'
];

importantFiles.forEach(file => {
  try {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✓ ${file}: Exists`);
    } else {
      console.log(`✗ ${file}: Missing`);
    }
  } catch (error) {
    console.log(`✗ ${file}: Error checking - ${error.message}`);
  }
});

console.log('\n=== Environment Variables ===');
const envVars = [
  'NODE_ENV',
  'NEXT_TELEMETRY_DISABLED',
  'NODE_VERSION',
  'NPM_VERSION'
];

envVars.forEach(envVar => {
  console.log(`${envVar}:`, process.env[envVar] || 'Not set');
});

console.log('\n=== Debug Complete ==='); 