import { seedForMove } from '../bots/runner';
import type { BotPlayer, ForfeitReason } from '../bots/types';
import { isGameOver, newGame, otherSeat, step } from '../engine/game';
import { scoreBoard } from '../engine/scoring';
import type { GameConfig, Position, Seat } from '../engine/types';
import { toBotView } from '../engine/botView';

type Side = 'A' | 'B';

export type GameResult =
  | { readonly kind: 'finished'; readonly score: Readonly<Record<Side, number>> }
  | {
      readonly kind: 'forfeit';
      readonly by: Side;
      readonly reason: ForfeitReason;
      readonly detail: string;
    };

export interface GameRecord {
  readonly config: GameConfig;
  readonly seatOfA: Seat;
  readonly positionsInPlayOrder: readonly Position[];
  readonly result: GameResult;
}

interface MatchOptions {
  readonly pairs: number;
  readonly baseSeed: number;
}

// Both games of a pair use one seed, so both bots play the same deal: once
// with A scoring rows, once with A scoring columns. The seat that moves first
// stays the same, so the bot that moved first in one game moves second in the
// other. That seat alternates between pairs.
function gamesOfPair(pairNumber: number, baseSeed: number): [GameConfig, Seat][] {
  const config: GameConfig = {
    seed: baseSeed + pairNumber,
    firstMover: pairNumber % 2 === 0 ? 'rows' : 'columns',
  };
  return [
    [config, 'rows'],
    [config, 'columns'],
  ];
}

export function playGame(
  players: Readonly<Record<Side, BotPlayer>>,
  config: GameConfig,
  seatOfA: Seat,
): GameRecord {
  let state = newGame(config);
  const positionsInPlayOrder: Position[] = [];
  while (!isGameOver(state)) {
    const seat = state.toMove;
    const side: Side = seat === seatOfA ? 'A' : 'B';
    const view = toBotView(state, seat);
    const decision = players[side].chooseMove(view, seedForMove(config.seed, view.moveNumber));
    if (!decision.ok) {
      const { reason, detail } = decision;
      return {
        config,
        seatOfA,
        positionsInPlayOrder,
        result: { kind: 'forfeit', by: side, reason, detail },
      };
    }
    const stepped = step(state, { seat, position: decision.position });
    if (!stepped.ok) {
      const { row, column } = decision.position;
      throw new Error(
        `The engine rejected row ${row}, column ${column} as "${stepped.error}" after the bot ` +
          'runner had accepted it. The two checks should always agree.',
      );
    }
    positionsInPlayOrder.push(decision.position);
    state = stepped.state;
  }
  const { total } = scoreBoard(state.board);
  const score = { A: total[seatOfA], B: total[otherSeat(seatOfA)] };
  return { config, seatOfA, positionsInPlayOrder, result: { kind: 'finished', score } };
}

// Returns the games in order, so games 2k and 2k + 1 are always one pair.
export function runMatch(
  players: Readonly<Record<Side, BotPlayer>>,
  { pairs, baseSeed }: MatchOptions,
): GameRecord[] {
  const games: GameRecord[] = [];
  for (let pairNumber = 0; pairNumber < pairs; pairNumber++) {
    for (const [config, seatOfA] of gamesOfPair(pairNumber, baseSeed)) {
      games.push(playGame(players, config, seatOfA));
    }
  }
  return games;
}
