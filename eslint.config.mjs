import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  // Base config
  {
    ignores: ['node_modules', 'dist', 'build', '.prisma', 'coverage', '*.log', '*.tsbuildinfo'],
  },

  // Main config
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Reads tsconfig.json
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier,
      import: importPlugin,
    },

    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      importPlugin.configs.recommended,
      importPlugin.configs.typescript,
      prettier, // ensures no conflicts
    ],

    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Import order
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Good practice rules
      'no-console': 'off',
      'no-unsafe-optional-chaining': 'error',
    },
  },
);
