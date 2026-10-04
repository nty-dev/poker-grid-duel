import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/sim/args';

const KNOWN_BOTS = ['random', 'greedy', 'montecarlo'];

describe('parseArgs', () => {
  it('reads --games, --seed and --bots', () => {
    expect(parseArgs(['--games=10', '--seed=3', '--bots=random,greedy'], KNOWN_BOTS)).toEqual({
      ok: true,
      value: { games: 10, seed: 3, bots: ['random', 'greedy'] },
    });
  });

  it.each([
    ['an odd number of games, because games are played in pairs', '--games=7'],
    ['a seed that is not an integer', '--seed=1.5'],
    ['a bot it does not know', '--bots=random,nobody'],
    ['a single bot', '--bots=random'],
    ['a flag it does not know', '--colour=red'],
  ])('rejects %s', (_what, argument) => {
    expect(parseArgs([argument], KNOWN_BOTS).ok).toBe(false);
  });
});
