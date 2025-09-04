// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  // Base
  { ignores: ['node_modules/**', '.next/**', 'dist/**', 'next-env.d.ts'] },
  js.configs.recommended,

  // TypeScript (basic rules for all files)
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    rules: {
      // Basic TypeScript rules that don't require type information
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with TS rule
    },
  },

  // TypeScript (type-checked rules only for TS/TSX files)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], // ensure this path is correct
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Strict TS useful for this codebase
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        { allowNumber: true, allowBoolean: true },
      ],
      // Add type-checked rules manually
      '@typescript-eslint/await-thenable': 'error',
    },
  },

  // React + Hooks
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
    },
  },

  // Global rules
  {
    rules: {
      'no-console': 'error',
    },
  },

  // Override for test files and scripts where console is intentional
  {
    files: ['**/*.test.*', '**/tests/**', 'scripts/**', '**/test/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
