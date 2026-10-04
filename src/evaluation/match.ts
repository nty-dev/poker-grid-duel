import type { BotPlayer, ForfeitReason } from '../bots/types';
import { newGame, step } from '../engine/gameState/advanceGame';
import { isGameOver, otherSeat } from '../engine/gameState/readGameState';
import { scoreBoard } from '../engine/scoring';
import type { GameConfig, Seat } from '../engine/types';
import { toBotView } from '../engine/botView';

type Side = 'A' | 'B';

export type GameResult =
  | { readonly kind: 'finished'; readonly points: Readonly<Record<Side, number>> }
  | {
      readonly kind: 'forfeit';
      readonly by: Side;
      readonly reason: ForfeitReason;
      readonly detail: string;
    };

export interface GameRecord {
  readonly config: GameConfig;
  readonly seatOfA: Seat;
  readonly result: GameResult;
}

interface MatchOptions {
  readonly pairCount: number;
  readonly baseSeed: number;
}

export type GamePair = readonly [GameRecord, GameRecord];

function dealForPair(pairNumber: number, baseSeed: number): GameConfig {
  return { seed: baseSeed + pairNumber, firstMover: pairNumber % 2 === 0 ? 'rows' : 'columns' };
}

export function playGame(
  players: Readonly<Record<Side, BotPlayer>>,
  config: GameConfig,
  seatOfA: Seat,
): GameRecord {
  let state = newGame(config);
  while (!isGameOver(state)) {
    const seat = state.toMove;
    const side: Side = seat === seatOfA ? 'A' : 'B';
    const decision = players[side].chooseMove(toBotView(state, seat));
    if (!decision.ok) {
      const { reason, detail } = decision;
      return { config, seatOfA, result: { kind: 'forfeit', by: side, reason, detail } };
    }
    const stepped = step(state, { seat, position: decision.position });
    if (!stepped.ok) {
      const { row, column } = decision.position;
      throw new Error(
        `The engine rejected row ${row}, column ${column} as "${stepped.error}" after the bot ` +
          'runner had accepted it. The two checks should always agree.',
      );
    }
    state = stepped.state;
  }
  const { total } = scoreBoard(state.board);
  const points = { A: total[seatOfA], B: total[otherSeat(seatOfA)] };
  return { config, seatOfA, result: { kind: 'finished', points } };
}

export function runMatch(
  players: Readonly<Record<Side, BotPlayer>>,
  { pairCount, baseSeed }: MatchOptions,
): GamePair[] {
  const gamePairs: GamePair[] = [];
  for (let pairNumber = 0; pairNumber < pairCount; pairNumber++) {
    const deal = dealForPair(pairNumber, baseSeed);
    gamePairs.push([playGame(players, deal, 'rows'), playGame(players, deal, 'columns')]);
  }
  return gamePairs;
}
