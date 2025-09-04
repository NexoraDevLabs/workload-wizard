#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'node:child_process';
import { globby } from 'globby';
import fs from 'node:fs';

const buildCmd = process.env.BUILD_CMD || 'pnpm build';
console.log('Building application...');
execSync(buildCmd, { stdio: 'inherit' });

// Adjust these to your build output directories
const dirs = ['.next', 'dist', 'build'].filter(d => fs.existsSync(d));
if (dirs.length === 0) {
  console.log('No build directories found; skipping check.');
  process.exit(0);
}

console.log(`Checking for console calls in: ${dirs.join(', ')}`);

const files = await globby(dirs.map(d => `${d}/**/*.{js,jsx,ts,tsx}`), {
  ignore: ['**/*.map', '**/node_modules/**'],
});

const pattern = /\bconsole\.(log|info|warn|error)\s*\(/;
const offenders = [];

// Patterns that indicate third-party or framework code
const excludePatterns = [
  /node_modules/,
  /chunks\/\d+\./,
  /chunks\/[a-f0-9]+-[a-f0-9]+\./,
  /framework-/,
  /polyfills-/,
  /main-/,
  /edge-instrumentation/,
  /instrumentation\.js/,
  /middleware\.js/,
  /_error\.js/,
  /route\.js$/,
  /page\.js$/,
  /studio/,
  /\.next\/static\/chunks\/app\/.*\.js$/, // All app page chunks
  /\.next\/static\/chunks\/.*\.js$/, // All chunks (likely third-party)
];

for (const f of files) {
  // Skip files that are likely third-party or framework code
  if (excludePatterns.some(pattern => pattern.test(f))) {
    continue;
  }
  
  try {
    const text = fs.readFileSync(f, 'utf8');
    if (pattern.test(text)) {
      // Get line numbers for better debugging
      const lines = text.split('\n');
      const lineNumbers = [];
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          lineNumbers.push(index + 1);
        }
      });
      offenders.push({ file: f, lines: lineNumbers });
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${f}:`, error.message);
  }
}

if (offenders.length) {
  console.error('❌ Found console calls in built artefacts:');
  offenders.forEach(({ file, lines }) => {
    console.error(` - ${file}:${lines.join(',')}`);
  });
  console.error('\nThese console calls will appear in production bundles.');
  console.error('Please replace them with logger methods from @/lib/logger');
  process.exit(1);
} else {
  console.log('✅ No console calls present in built artefacts.');
}
