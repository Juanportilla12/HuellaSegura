const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['coverage/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  { files: ['**/*.mjs'], languageOptions: { sourceType: 'module' } },
  { files: ['tests/**/*.js'], languageOptions: { globals: { ...globals.jest } } },
];
