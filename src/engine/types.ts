export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

export interface Position {
  readonly row: number;
  readonly column: number;
}

type EmptyCell = null;
export type Cell = Card | EmptyCell;
type Row = readonly Cell[];
export type Board = readonly Row[];

export type Seat = 'rows' | 'columns';

export interface GameConfig {
  readonly seed: number;
  readonly firstMover: Seat;
}

export interface GameState {
  readonly board: Board;
  readonly deck: readonly Card[];
  readonly toMove: Seat;
}

export interface Move {
  readonly seat: Seat;
  readonly position: Position;
}

export type GameError = 'gameOver' | 'notYourTurn' | 'notOnBoard' | 'cellOccupied';

export type StepResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly error: GameError };

export type HandType =
  | 'highCard'
  | 'pair'
  | 'twoPair'
  | 'threeOfAKind'
  | 'flush'
  | 'straight'
  | 'fullHouse'
  | 'fourOfAKind'
  | 'straightFlush';

export interface LineScore {
  readonly hand: HandType;
  readonly points: number;
  readonly isComplete: boolean;
}

export interface BoardScore {
  readonly rows: readonly LineScore[];
  readonly columns: readonly LineScore[];
  readonly total: Readonly<Record<Seat, number>>;
}

export interface BotView {
  readonly board: Board;
  readonly mySeat: Seat;
  readonly currentCard: Card;
  readonly nextCard: Card | null;
  readonly moveNumber: number;
}

export type Seed = number | string;

export interface Rng {
  nextFloat(): number;
  nextIntBelow(limit: number): number;
}
