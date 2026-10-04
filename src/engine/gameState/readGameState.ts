import { BOARD_SIZE } from '../rules';
import type { Board, Card, GameState, Position, Seat } from '../types';

export function otherSeat(seat: Seat): Seat {
  return seat === 'rows' ? 'columns' : 'rows';
}

export function isOnBoard({ row, column }: Position): boolean {
  const isLineNumber = (value: number) =>
    Number.isInteger(value) && value >= 0 && value < BOARD_SIZE;
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
  const isLastTurn = emptyPositions(state.board).length <= 1;
  if (isLastTurn) return null;
  return state.deck[countPlacedCards(state) + 1] ?? null;
}
