import { describe, expect, it } from 'vitest';
import { PRESET_BOTS } from '../src/bots/presets/catalog';
import { PRESET_IDS, type Bot, type PresetId } from '../src/bots/types';
import { createRng } from '../src/engine/rng';
import { runMatch } from '../src/evaluation/match';
import { summarizeMatch } from '../src/evaluation/stats';
import { toBotView } from '../src/engine/botView';
import { EMPTY_ROWS, stateFrom } from './helpers';

function bot(id: PresetId): Bot {
  const preset = PRESET_BOTS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`No preset bot is called ${id}`);
  return preset.createBot(createRng(1));
}

function resultsAgainstRandom(id: PresetId, games: number) {
  return summarizeMatch(
    runMatch({ A: bot(id), B: bot('random') }, { pairCount: games / 2, baseSeed: 1000 }),
  );
}

describe.each(PRESET_IDS)('%s', (id) => {
  it('finishes whole games from both seats without forfeiting', () => {
    const games = runMatch(
      { A: bot(id), B: bot('random') },
      { pairCount: 2, baseSeed: 1000 },
    ).flat();
    expect(games.map((game) => game.result.kind)).toEqual(Array(4).fill('finished'));
  });
});

describe('greedy', () => {
  it('completes its own flush', () => {
    const state = stateFrom(['AH 3H 7H JH .', ...EMPTY_ROWS.slice(1)], '9H', '2C');
    expect(bot('greedy').chooseMove(toBotView(state, 'rows'))).toEqual({ row: 0, column: 4 });
  });

  it('blocks the last cell of an opponent column that is one card from a straight flush', () => {
    const state = stateFrom(
      ['. . . . 9S', '. . . . TS', '. . . . JS', '. . . . QS', '. . . . .'],
      '2D',
      'KS',
    );
    expect(bot('greedy').chooseMove(toBotView(state, 'rows'))).toEqual({ row: 4, column: 4 });
  });

  it('wins far more often than it loses against random', () => {
    const results = resultsAgainstRandom('greedy', 100);
    expect(results.wins).toBeGreaterThan(results.losses * 3);
  });
});

describe('montecarlo', () => {
  it('puts the fourth seven in the row that holds the other three', () => {
    const state = stateFrom(['7S 7H 7D . .', ...EMPTY_ROWS.slice(1)], '7C', '2D');
    expect(bot('montecarlo').chooseMove(toBotView(state, 'rows')).row).toBe(0);
  });

  it('wins at least 16 of 20 games against random', () => {
    expect(resultsAgainstRandom('montecarlo', 20).wins).toBeGreaterThanOrEqual(16);
  }, 60_000);
});
