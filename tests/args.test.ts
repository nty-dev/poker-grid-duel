import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/sim/args';

describe('parseArgs', () => {
  it('reads --games and --seed', () => {
    expect(parseArgs(['--games=10', '--seed=3'])).toEqual({
      ok: true,
      value: { games: 10, seed: 3 },
    });
  });

  it.each([
    ['an odd number of games, because games are played in pairs', '--games=7'],
    ['a seed that is not an integer', '--seed=1.5'],
    ['a flag it does not know', '--colour=red'],
  ])('rejects %s', (_what, argument) => {
    expect(parseArgs([argument]).ok).toBe(false);
  });
});
