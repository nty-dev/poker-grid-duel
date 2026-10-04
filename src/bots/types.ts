import type { Board, BotView, Card, Cell, HandType, Position } from '../engine/types';

export type ForfeitReason = 'exception' | 'invalid_move';

export type BotDecision =
  | { readonly ok: true; readonly position: Position }
  | { readonly ok: false; readonly reason: ForfeitReason; readonly detail: string };

export interface BotPlayer {
  chooseMove(view: BotView): BotDecision;
}

export const PRESET_IDS = ['random', 'greedy', 'montecarlo'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export interface PresetBot {
  readonly id: PresetId;
  readonly name: string;
  readonly description: string;
  readonly source: string;
  readonly ratingFromTournament: number;
}

interface HandValue {
  readonly hand: HandType;
  readonly points: number;
}

type LineKind = 'row' | 'column';

export interface BotHelpers {
  emptyPositions(board: Board): Position[];
  lineOf(board: Board, kind: LineKind, lineNumber: number): Cell[];
  evaluateHand(fiveCards: readonly Card[]): HandValue;
  place(board: Board, position: Position, card: Card): Board;
  random(): number;
  shuffle<T>(items: readonly T[]): T[];
}

export type ChooseMove = (view: BotView, helpers: BotHelpers) => unknown;
