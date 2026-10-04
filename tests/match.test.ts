import { describe, expect, it } from 'vitest';
import type { BotPlayer } from '../src/bots/types';
import { createBotPlayer } from '../src/bots/runner';
import { emptyPositions, otherSeat } from '../src/engine/game';
import { scoreBoard } from '../src/engine/scoring';
import type { Move, Position } from '../src/engine/types';
import { playGame, runMatch, type GameRecord } from '../src/evaluation/match';
import { readPresetSource } from '../src/sim/presetSources';
import { replay } from './helpers';

const random = () => createBotPlayer(readPresetSource('random'));
const greedy = () => createBotPlayer(readPresetSource('greedy'));

// A record stores only the positions; the seats alternate from the first mover.
function movesOf(record: GameRecord): Move[] {
  const first = record.config.firstMover;
  return record.positionsInPlayOrder.map((position, turn) => ({
    seat: turn % 2 === 0 ? first : otherSeat(first),
    position,
  }));
}

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

  it('records enough to replay each game to the score it reported', () => {
    for (const game of runMatch({ A: greedy(), B: random() }, { pairs: 1, baseSeed: 5 })) {
      const replayed = replay(game.config, movesOf(game));
      if (!replayed.ok || game.result.kind !== 'finished') throw new Error('expected a full game');
      const { total } = scoreBoard(replayed.state.board);
      expect(game.result.score).toEqual({
        A: total[game.seatOfA],
        B: total[otherSeat(game.seatOfA)],
      });
    }
  });

  it('gives the same games for the same bots and seed', () => {
    const run = () => runMatch({ A: greedy(), B: random() }, { pairs: 1, baseSeed: 99 });
    expect(run()).toEqual(run());
  });
});

describe('playGame', () => {
  it('ends the game when a bot forfeits, recording who, why and the moves so far', () => {
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
    expect(game.positionsInPlayOrder).toHaveLength(6);
  });
});
