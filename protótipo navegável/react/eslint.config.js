import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: { globals: { console: 'readonly', URL: 'readonly' } } },
  { files: ['**/*.{js,jsx}'], languageOptions: { parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } }, globals: { window: 'readonly', document: 'readonly', localStorage: 'readonly', console: 'readonly', location: 'readonly', history: 'readonly', alert: 'readonly', setTimeout: 'readonly' } }, plugins: { 'react-hooks': reactHooks }, rules: { 'no-unused-vars': 'off', 'react-hooks/rules-of-hooks': 'error' } }
];
