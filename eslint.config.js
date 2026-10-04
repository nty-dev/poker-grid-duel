import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const determinism = {
  'no-restricted-properties': [
    'error',
    { object: 'Math', property: 'random', message: 'Use the seeded Rng / helpers.random().' },
    { object: 'Date', property: 'now', message: 'Pass time in from the caller.' },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: "NewExpression[callee.name='Date']", message: 'Pass time in from the caller.' },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Preset bot source: plain scripts run via new Function. No browser or
    // Node globals: a bot only gets its arguments.
    extends: [js.configs.recommended],
    files: ['src/bots/**/*.js'],
    languageOptions: { sourceType: 'script', globals: {} },
    rules: determinism,
  },
  {
    // Deterministic code: no ambient randomness or clocks.
    files: ['src/engine/**', 'src/bots/**', 'src/evaluation/**'],
    rules: determinism,
  },
);
