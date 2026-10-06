import { describe, expect, it } from 'vitest';
import { BOT_CATALOG } from '../src/bots/strategies/catalog';
import { createRng } from '../src/engine/rng';
import { runMatch } from '../src/evaluation/match';

describe.each(BOT_CATALOG)('$name', (entry) => {
  it('completes a game against itself from both seats without forfeiting', () => {
    const players = { A: entry.createBot(createRng(1)), B: entry.createBot(createRng(2)) };
    const [gameWithARows, gameWithAColumns] =
      runMatch(players, { pairCount: 1, baseSeed: 1 })[0] ?? [];
    expect(gameWithARows?.result.kind).toBe('finished');
    expect(gameWithAColumns?.result.kind).toBe('finished');
  });
});
