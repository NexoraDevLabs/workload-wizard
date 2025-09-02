/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
 
import { useEffect, useState } from 'react';

export function useEnvironment() {
  const [envVars, setEnvVars] = useState({});
  const [loadedFrom, setLoadedFrom] = useState(null);

  useEffect(() => {
    // Client-side environment loading
    const loadClientEnv = async () => {
      try {
        // Try to load from API route that reads env files
        const response = await fetch('/api/env');
        if (response.ok) {
          const data = await response.json();
          setEnvVars(data.vars);
          setLoadedFrom(data.file);
        }
      } catch (error) {
        console.error('Failed to load environment:', error);
      }
    };

    void loadClientEnv();
  }, []);

  return { envVars, loadedFrom };
}

// Server-side environment getter
export function getServerEnvironment() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnvironment can only be used on the server');
  }
  
  const { loadEnvironment } = require('../lib/env-loader');
  return loadEnvironment();
}