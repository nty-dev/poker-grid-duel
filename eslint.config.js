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
    // The firewall between a bot and the game: a bot is given only a BotView,
    // and may import only the rules of the game. It cannot import what deals
    // or advances a game, a random number generator of its own, or the code
    // that runs it.
    files: ['src/bots/presets/*.ts'],
    ignores: ['src/bots/presets/catalog.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '^(?!(\\.\\./\\.\\./engine/(types|rules|evaluator|scoring|deck|gameState/readGameState)|\\.\\./types)$)',
              message:
                'A bot may import only engine/{types,rules,evaluator,scoring,deck,gameState/readGameState} and bots/types.',
            },
          ],
        },
      ],
    },
  },
  {
    // Deterministic code: no ambient randomness or clocks.
    files: ['src/engine/**', 'src/bots/**', 'src/evaluation/**'],
    rules: determinism,
  },
);
