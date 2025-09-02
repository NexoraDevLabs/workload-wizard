/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');

function loadEnvironment() {
  const envFiles = ['.env.dev.local', '.env.prod.local', '.env.local', '.env'];

  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);

    if (fs.existsSync(envPath)) {
      // Parse .env file manually to avoid dotenv dependency issues
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};

      envContent.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            envVars[key.trim()] = value;
            // Set in process.env if not already set
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      });

      console.warn(`✅ Loaded environment from: ${envFile}`);
      return { file: envFile, vars: envVars };
    }
  }

  console.warn('⚠️ No environment file found');
  return { file: null, vars: {} };
}

module.exports = { loadEnvironment };
