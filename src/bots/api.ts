import { fisherYatesShuffle } from '../engine/deck';
import { classifyHand } from '../engine/evaluator';
import type { Board, Position, Seed } from '../engine/types';
import { emptyPositions, isOnBoard, withCardAt } from '../engine/game';
import { createRng } from '../engine/rng';
import { BOARD_SIZE, HAND_POINTS } from '../engine/rules';
import { lineCells } from '../engine/scoring';
import type { BotHelpers } from './types';

function assertIsBoard(board: Board): void {
  const isGrid =
    Array.isArray(board) &&
    board.length === BOARD_SIZE &&
    board.every((cellsInRow) => Array.isArray(cellsInRow) && cellsInRow.length === BOARD_SIZE);
  if (!isGrid) throw new TypeError(`board must be ${BOARD_SIZE} rows of ${BOARD_SIZE} cells`);
}

function assertIsLineNumber(lineNumber: number): void {
  const isLineNumber = Number.isInteger(lineNumber) && lineNumber >= 0 && lineNumber < BOARD_SIZE;
  if (!isLineNumber) {
    throw new RangeError(
      `line number must be an integer 0–${BOARD_SIZE - 1}, got ${String(lineNumber)}`,
    );
  }
}

function assertIsOnBoard(position: Position): void {
  const isPosition = typeof position === 'object' && position !== null && isOnBoard(position);
  if (!isPosition) {
    throw new RangeError(
      `position must be { row, column } with both 0–${BOARD_SIZE - 1}, got ${JSON.stringify(position)}`,
    );
  }
}

// The bots are plain JavaScript, so the compiler cannot check their calls.
// Each helper checks its arguments and throws a clear error instead.
export function createHelpers(randomSeed: Seed): BotHelpers {
  const rng = createRng(randomSeed);
  return {
    emptyPositions(board) {
      assertIsBoard(board);
      return emptyPositions(board);
    },
    lineOf(board, kind, lineNumber) {
      assertIsBoard(board);
      if (kind !== 'row' && kind !== 'column') {
        throw new TypeError(`kind must be "row" or "column", got ${String(kind)}`);
      }
      assertIsLineNumber(lineNumber);
      return lineCells(board, kind === 'row' ? 'rows' : 'columns', lineNumber);
    },
    evaluateHand(fiveCards) {
      const isFiveCards =
        Array.isArray(fiveCards) && fiveCards.length === BOARD_SIZE && fiveCards.every(Boolean);
      if (!isFiveCards) throw new TypeError('evaluateHand needs exactly 5 cards');
      const hand = classifyHand(fiveCards);
      return { hand, points: HAND_POINTS[hand] };
    },
    place(board, position, card) {
      assertIsBoard(board);
      assertIsOnBoard(position);
      if (board[position.row]?.[position.column] !== null) {
        throw new RangeError(`row ${position.row}, column ${position.column} is occupied`);
      }
      return withCardAt(board, position, card);
    },
    random: () => rng.nextFloat(),
    shuffle: (items) => fisherYatesShuffle(items, rng),
  };
}
