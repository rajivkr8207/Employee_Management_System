import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      '.env*',
      'public/**/*',
      'dist/**',
      'coverage/**',
      'uploads/**',
      'tests',
      'src/middlewares/error.middlewares.js',
      'src/app.middleware.js'
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },

    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'no-console': 'off',

      'no-undef': 'error',

      'prefer-const': 'error',

      'no-var': 'error',
    },
  },

  prettier,
];
