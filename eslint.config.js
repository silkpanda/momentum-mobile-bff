import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // 1. Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.env',
      '.env.local',
    ],
  },

  // 2. Base JavaScript rules
  js.configs.recommended,

  // 3. TypeScript rules
  // This replaces @typescript-eslint/recommended
  ...tseslint.configs.recommended,

  // 4. Prettier setup
  // This must come LAST to override other formatting rules.
  // This one import handles 'eslint-plugin-prettier' and 'eslint-config-prettier'
  eslintPluginPrettierRecommended,

  // 5. Project-specific settings
  {
    languageOptions: {
      globals: {
        ...globals.node, // Use Node.js global variables
      },
      parserOptions: {
        // This enables type-aware linting
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // You can add any custom rule overrides here
      // e.g., '@typescript-eslint/no-unused-vars': 'warn'
    },
  },
);