import { describe, expect, it } from 'vitest';
import type { BotPlayer } from '../src/bots/types';
import { createBotPlayer } from '../src/bots/runner';
import { emptyPositions } from '../src/engine/game';
import type { Position } from '../src/engine/types';
import { playGame, runMatch } from '../src/evaluation/match';
import { readPresetSource } from '../src/sim/presetSources';

const random = () => createBotPlayer(readPresetSource('random'));
const greedy = () => createBotPlayer(readPresetSource('greedy'));

describe('runMatch', () => {
  it('plays each seed twice with the seats swapped, and alternates which seat moves first', () => {
    const games = runMatch({ A: greedy(), B: random() }, { pairs: 2, baseSeed: 10 });
    expect(games.map((game) => [game.config.seed, game.config.firstMover, game.seatOfA])).toEqual([
      [10, 'rows', 'rows'],
      [10, 'rows', 'columns'],
      [11, 'columns', 'rows'],
      [11, 'columns', 'columns'],
    ]);
  });

  it('gives the same games for the same bots and seed', () => {
    const run = () => runMatch({ A: greedy(), B: random() }, { pairs: 1, baseSeed: 99 });
    expect(run()).toEqual(run());
  });
});

describe('playGame', () => {
  it('ends the game when a bot forfeits, recording who and why', () => {
    const quitsOnSeventhMove: BotPlayer = {
      chooseMove: (view) =>
        view.moveNumber < 6
          ? { ok: true, position: emptyPositions(view.board)[0] as Position }
          : { ok: false, reason: 'exception', detail: 'Error: boom' },
    };
    const game = playGame(
      { A: quitsOnSeventhMove, B: quitsOnSeventhMove },
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
