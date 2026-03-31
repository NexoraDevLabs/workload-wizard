import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: [
      {
        find: '@/lib',
        replacement: path.resolve(__dirname, './src/lib'),
      },
      {
        find: '@/components',
        replacement: path.resolve(__dirname, './src/components'),
      },
      {
        find: '@/server',
        replacement: path.resolve(__dirname, './src/server'),
      },
      {
        find: '@/config',
        replacement: path.resolve(__dirname, './config'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
  },
});
