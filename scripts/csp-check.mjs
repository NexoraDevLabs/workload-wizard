#!/usr/bin/env node

/**
 * CSP Check Script
 *
 * This script validates the CSP configuration and outputs the effective policy
 * for both report-only and enforce modes.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
function loadEnv() {
  try {
    const envContent = readFileSync(join(projectRoot, '.env.csp'), 'utf8');
    const envVars = {};
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    return {};
  }
}

// Mock environment for CSP functions
const mockEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_CONVEX_URL:
    process.env.NEXT_PUBLIC_CONVEX_URL || 'https://mock.convex.cloud',
  CSP_MODE: process.env.CSP_MODE || 'report-only',
  ...loadEnv(),
};

// Set environment variables for the CSP module
Object.entries(mockEnv).forEach(([key, value]) => {
  if (value !== undefined) {
    process.env[key] = value;
  }
});

// Create a temporary TypeScript file to run the CSP check
async function checkCSP() {
  const tempFile = join(projectRoot, 'temp-csp-check.ts');

  try {
    const cspScript = `
import { buildCsp, getCSPMode, generateNonce } from './src/lib/security/csp';

console.log('🔍 CSP Configuration Check\\n');

const mode = getCSPMode();
const nonce = generateNonce();

console.log('Environment:', process.env.NODE_ENV);
console.log('CSP Mode:', mode);
console.log('');

console.log('Test Nonce:', nonce);
console.log('');

// Build CSP policy for current mode
const currentPolicy = buildCsp({
  nonce,
  mode,
  reportUri: '/api/csp-report',
  reportTo: 'csp-endpoint'
});

console.log(\`📋 Current CSP Policy (\${mode}):\`);
console.log('─'.repeat(50));
console.log(currentPolicy);
console.log('');

// Show what the policy would look like in enforce mode
const enforcePolicy = buildCsp({
  nonce,
  mode: 'enforce',
  reportUri: '/api/csp-report',
  reportTo: 'csp-endpoint'
});

console.log('📋 CSP Policy in Enforce Mode:');
console.log('─'.repeat(50));
console.log(enforcePolicy);
console.log('');

// Validate policy structure
const hasReportOnly = currentPolicy.includes('report-uri') || currentPolicy.includes('report-to');
const hasEnforce = currentPolicy.includes('Content-Security-Policy');

console.log('✅ Validation Results:');
console.log(\`   Mode: \${mode}\`);
console.log(\`   Has reporting directives: \${hasReportOnly ? '✅' : '❌'}\`);
console.log(\`   Policy length: \${currentPolicy.length} characters\`);
console.log(\`   Directive count: \${currentPolicy.split(';').length}\`);

if (mode === 'report-only' && !hasReportOnly) {
  console.log('⚠️  Warning: Report-only mode should include reporting directives');
}

console.log('\\n🎯 Next Steps:');
console.log('   1. Test the policy in report-only mode first');
console.log('   2. Monitor violations at /admin/csp');
console.log('   3. Adjust allowlist in config/security/csp.allowlist.ts');
console.log('   4. Switch to enforce mode when ready');
`;

    writeFileSync(tempFile, cspScript);

    // Run the TypeScript file with tsx
    const runResult = spawnSync(
      process.execPath,
      ['--import', 'tsx', tempFile],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, ...mockEnv },
        shell: false,
      }
    );
    if (runResult.status !== 0) {
      throw new Error('CSP check process failed');
    }
  } catch (error) {
    console.error('❌ Error checking CSP configuration:', error.message);
    process.exit(1);
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFile);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

checkCSP();
