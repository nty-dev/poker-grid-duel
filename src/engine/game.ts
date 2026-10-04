import { createDeck, fisherYatesShuffle } from './deck';
import { createRng } from './rng';
import { BOARD_SIZE } from './rules';
import type {
  Board,
  Card,
  GameConfig,
  GameError,
  GameState,
  Move,
  Position,
  Seat,
  StepResult,
} from './types';

export function otherSeat(seat: Seat): Seat {
  return seat === 'rows' ? 'columns' : 'rows';
}

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

export function newGame({ seed, firstMover }: GameConfig): GameState {
  return {
    board: emptyBoard(),
    deck: fisherYatesShuffle(createDeck(), createRng(seed)),
    toMove: firstMover,
  };
}

export function isOnBoard({ row, column }: Position): boolean {
  const isLineNumber = (n: number) => Number.isInteger(n) && n >= 0 && n < BOARD_SIZE;
  return isLineNumber(row) && isLineNumber(column);
}

export function emptyPositions(board: Board): Position[] {
  const positions: Position[] = [];
  board.forEach((cellsInRow, row) => {
    cellsInRow.forEach((cell, column) => {
      if (cell === null) positions.push({ row, column });
    });
  });
  return positions;
}

export function withCardAt(board: Board, position: Position, card: Card): Board {
  return board.map((cellsInRow, row) =>
    row === position.row
      ? cellsInRow.map((cell, column) => (column === position.column ? card : cell))
      : cellsInRow,
  );
}

export function countPlacedCards(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

export function isGameOver(state: GameState): boolean {
  return emptyPositions(state.board).length === 0;
}

export function currentCard(state: GameState): Card | null {
  return isGameOver(state) ? null : (state.deck[countPlacedCards(state)] ?? null);
}

export function nextCard(state: GameState): Card | null {
  const isLastTurn = emptyPositions(state.board).length === 1;
  // The card after the last placement is never revealed.
  return isLastTurn ? null : (state.deck[countPlacedCards(state) + 1] ?? null);
}

function findMoveError(state: GameState, { seat, position }: Move): GameError | null {
  if (isGameOver(state)) return 'gameOver';
  if (seat !== state.toMove) return 'notYourTurn';
  if (!isOnBoard(position)) return 'notOnBoard';
  if (state.board[position.row]?.[position.column] !== null) return 'cellOccupied';
  return null;
}

export function step(state: GameState, move: Move): StepResult {
  const error = findMoveError(state, move);
  if (error) return { ok: false, error };

  const card = currentCard(state);
  if (!card) {
    throw new Error(
      `The deck ran out with the board unfinished: ${countPlacedCards(state)} cards are placed ` +
        `and the deck holds ${state.deck.length}. A game needs ${BOARD_SIZE * BOARD_SIZE}.`,
    );
  }

  return {
    ok: true,
    state: {
      board: withCardAt(state.board, move.position, card),
      deck: state.deck,
      toMove: otherSeat(state.toMove),
    },
  };
}
