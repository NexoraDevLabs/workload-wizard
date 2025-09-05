/**
 * CSP Allowlist Configuration
 * 
 * This file allows environment-specific overrides for CSP allowlists.
 * Add domains here that need to be whitelisted for specific environments.
 */

export interface CSPAllowlistOverride {
  development?: string[];
  production?: string[];
  test?: string[];
}

export const CSP_ALLOWLIST_OVERRIDES: Record<string, CSPAllowlistOverride> = {
  // Additional script sources
  scriptSrc: {
    development: [
      // Add development-specific script sources here
      // Example: 'https://localhost:3000'
    ],
    production: [
      // Add production-specific script sources here
    ],
  },
  
  // Additional style sources
  styleSrc: {
    development: [
      // Add development-specific style sources here
    ],
    production: [
      // Add production-specific style sources here
    ],
  },
  
  // Additional image sources
  imgSrc: {
    development: [
      // Add development-specific image sources here
    ],
    production: [
      // Add production-specific image sources here
    ],
  },
  
  // Additional connect sources
  connectSrc: {
    development: [
      // Add development-specific connect sources here
      // Example: 'ws://localhost:3000' for WebSocket connections
    ],
    production: [
      // Add production-specific connect sources here
    ],
  },
  
  // Additional frame sources
  frameSrc: {
    development: [
      // Add development-specific frame sources here
    ],
    production: [
      // Add production-specific frame sources here
    ],
  },
};

/**
 * Get environment-specific allowlist overrides
 */
export function getAllowlistOverrides(environment: string): Record<string, string[]> {
  const overrides: Record<string, string[]> = {};
  
  Object.entries(CSP_ALLOWLIST_OVERRIDES).forEach(([directive, envOverrides]) => {
    const envOverride = envOverrides[environment as keyof CSPAllowlistOverride];
    if (envOverride) {
      overrides[directive] = envOverride;
    }
  });
  
  return overrides;
}
