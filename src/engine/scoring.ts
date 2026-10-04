import { classifyHand } from './evaluator';
import { BOARD_SIZE, HAND_POINTS } from './rules';
import type { Board, BoardScore, Card, Cell, LineScore, Seat } from './types';

type Outcome = { readonly kind: 'win'; readonly winner: Seat } | { readonly kind: 'draw' };

const LINE_NUMBERS = Array.from({ length: BOARD_SIZE }, (_, lineNumber) => lineNumber);

export function lineCells(board: Board, seat: Seat, lineNumber: number): Cell[] {
  const cellsInRow = board[lineNumber];
  if (!cellsInRow) {
    throw new Error(`There is no line ${lineNumber}: lines are numbered 0 to ${BOARD_SIZE - 1}.`);
  }
  return seat === 'rows'
    ? [...cellsInRow]
    : board.map((cellsInEachRow) => cellsInEachRow[lineNumber] ?? null);
}

export function scoreLine(cells: readonly Cell[]): LineScore {
  const cards = cells.filter((cell): cell is Card => cell !== null);
  const hand = classifyHand(cards);
  return { hand, points: HAND_POINTS[hand], isComplete: cards.length === BOARD_SIZE };
}

export function scoreBoard(board: Board): BoardScore {
  const scoreLinesOf = (seat: Seat) =>
    LINE_NUMBERS.map((lineNumber) => scoreLine(lineCells(board, seat, lineNumber)));
  const sumPoints = (lines: LineScore[]) => lines.reduce((sum, line) => sum + line.points, 0);
  const rows = scoreLinesOf('rows');
  const columns = scoreLinesOf('columns');
  return { rows, columns, total: { rows: sumPoints(rows), columns: sumPoints(columns) } };
}

export function outcome(total: Readonly<Record<Seat, number>>): Outcome {
  if (total.rows === total.columns) return { kind: 'draw' };
  return { kind: 'win', winner: total.rows > total.columns ? 'rows' : 'columns' };
}
