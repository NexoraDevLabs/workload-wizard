/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const { loadEnvironment } = require('./lib/env-loader');

// Load environment variables on startup
loadEnvironment();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // These will be available on both server and client
    NODE_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;