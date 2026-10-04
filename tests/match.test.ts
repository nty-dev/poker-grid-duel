import { describe, expect, it } from 'vitest';
import { createGreedyBot } from '../src/bots/presets/greedy';
import { createRandomBot } from '../src/bots/presets/random';
import type { Bot } from '../src/bots/types';
import { emptyPositions } from '../src/engine/gameState/readGameState';
import { createRng } from '../src/engine/rng';
import type { Position } from '../src/engine/types';
import { playGame, runMatch } from '../src/evaluation/match';

const random = () => createRandomBot(createRng(1));
const greedy = () => createGreedyBot();

describe('runMatch', () => {
  it('plays each seed twice with the seats swapped, and alternates which seat moves first', () => {
    const games = runMatch({ A: greedy(), B: random() }, { pairCount: 2, baseSeed: 10 }).flat();
    expect(games.map((game) => [game.config.seed, game.config.firstMover, game.seatOfA])).toEqual([
      [10, 'rows', 'rows'],
      [10, 'rows', 'columns'],
      [11, 'columns', 'rows'],
      [11, 'columns', 'columns'],
    ]);
  });

  it('gives the same games for the same bots and seed', () => {
    const run = () => runMatch({ A: greedy(), B: random() }, { pairCount: 1, baseSeed: 99 });
    expect(run()).toEqual(run());
  });
});

describe('playGame', () => {
  it('ends the game when a bot forfeits, recording who and why', () => {
    const throwsOnSeventhMove: Bot = {
      chooseMove: (view) => {
        const cardsOnBoard = view.board.flat().filter((cell) => cell !== null).length;
        if (cardsOnBoard >= 6) throw new Error('boom');
        return emptyPositions(view.board)[0] as Position;
      },
    };
    const game = playGame(
      { A: throwsOnSeventhMove, B: throwsOnSeventhMove },
      { seed: 1, firstMover: 'rows' },
      'rows',
    );
    expect(game.result).toEqual({
      kind: 'forfeit',
      by: 'A',
      reason: 'exception',
      detail: 'Error: boom',
    });
  });
});
