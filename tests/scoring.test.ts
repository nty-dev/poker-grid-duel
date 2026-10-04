import { describe, expect, it } from 'vitest';
import { lineCells, outcome, scoreBoard } from '../src/engine/scoring';
import { boardFrom, cardLabel } from './helpers';

describe('lineCells', () => {
  it('reads rows left to right and columns top to bottom', () => {
    const board = boardFrom([
      '2H 3H 4H 5H 6H',
      '7S . . . .',
      '8S . . . .',
      '9S . . . .',
      'TS . . . .',
    ]);
    const labels = (cells: ReturnType<typeof lineCells>) => cells.map((c) => c && cardLabel(c));
    expect(labels(lineCells(board, 'rows', 0))).toEqual(['2H', '3H', '4H', '5H', '6H']);
    expect(labels(lineCells(board, 'columns', 0))).toEqual(['2H', '7S', '8S', '9S', 'TS']);
  });
});

describe('scoreBoard', () => {
  it('totals the rows for one seat and the columns for the other', () => {
    const score = scoreBoard(
      boardFrom([
        '2H 4H 6H 8H JH', // flush 12
        '5S 6D 7C 8S 9S', // straight 15
        'QS QH 3C 3S 4D', // two pair 5
        'AC AH AD AS 7H', // four of a kind 40
        '3D TC 7D KH 9H', // nothing
      ]),
    );
    expect(score.total.rows).toBe(12 + 15 + 5 + 40);
    // Columns 3, 4 and 5 each hold one pair (7s, 8s, 9s).
    expect(score.total.columns).toBe(2 + 2 + 2);
  });

  it('scores an unfinished line on the cards it has and marks it incomplete', () => {
    const score = scoreBoard(
      boardFrom(['AS AH 2C 7D 9S', 'KS KH . . .', '. . . . .', '. . . . .', '. . . . .']),
    );
    expect(score.rows[0]).toEqual({ hand: 'pair', points: 2, isComplete: true });
    expect(score.rows[1]).toEqual({ hand: 'pair', points: 2, isComplete: false });
  });
});

describe('outcome', () => {
  it('the higher total wins and equal totals draw', () => {
    expect(outcome({ rows: 5, columns: 3 })).toEqual({ kind: 'win', winner: 'rows' });
    expect(outcome({ rows: 1, columns: 3 })).toEqual({ kind: 'win', winner: 'columns' });
    expect(outcome({ rows: 4, columns: 4 })).toEqual({ kind: 'draw' });
  });
});
