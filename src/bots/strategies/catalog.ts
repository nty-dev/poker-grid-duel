import type { BotCatalogEntry } from '../types';
import { createGreedyBot } from './greedy';
import { createMonteCarloBot } from './montecarlo';
import { createRandomBot } from './random';

export const BOT_CATALOG: readonly BotCatalogEntry[] = [
  {
    id: 'random',
    name: 'Random',
    description: 'Places each card in a random empty cell.',
    ratingFromTournament: 800,
    createBot: createRandomBot,
  },
  {
    id: 'greedy',
    name: 'Greedy',
    description: 'Best immediate change in line potential, mine minus yours.',
    ratingFromTournament: 1354,
    createBot: createGreedyBot,
  },
  {
    id: 'montecarlo',
    name: 'Monte Carlo',
    description: 'Plays 100 random futures per candidate cell.',
    ratingFromTournament: 1576,
    createBot: createMonteCarloBot,
  },
];
