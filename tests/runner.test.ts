import { describe, expect, it } from 'vitest';
import { askBotForMove } from '../src/bots/runner';
import type { Bot } from '../src/bots/types';
import type { Position } from '../src/engine/types';
import { EMPTY_ROWS, stateFrom } from './helpers';

describe('askBotForMove', () => {
  const aceInTopLeft = ['AS . . . .', ...EMPTY_ROWS.slice(1)];
  const state = stateFrom(aceInTopLeft, '2C', '3C');
  const botThatAlwaysChooses = (position: Position): Bot => ({ chooseMove: () => position });

  it('accepts the position of an empty cell', () => {
    expect(askBotForMove(botThatAlwaysChooses({ row: 0, column: 1 }), state)).toEqual({
      ok: true,
      position: { row: 0, column: 1 },
    });
  });

  it('turns a thrown error into a forfeit', () => {
    const botThatThrows: Bot = {
      chooseMove: () => {
        throw new Error('boom');
      },
    };
    expect(askBotForMove(botThatThrows, state)).toEqual({
      ok: false,
      reason: 'exception',
      detail: 'Error: boom',
    });
  });

  it.each([
    ['an occupied cell', { row: 0, column: 0 }],
    ['a cell off the board', { row: 5, column: 0 }],
    ['a row that is not a whole number', { row: 0.5, column: 1 }],
  ])('turns %s into a forfeit', (_what, position) => {
    expect(askBotForMove(botThatAlwaysChooses(position), state)).toEqual({
      ok: false,
      reason: 'invalid_move',
      detail: `chose row ${position.row}, column ${position.column}, which is not an empty cell`,
    });
  });

  it('shows the bot only a view: no deck, and a board it cannot use to change the game', () => {
    let whatTheBotSaw: object = {};
    const botThatScribblesOnItsView: Bot = {
      chooseMove: (view) => {
        whatTheBotSaw = { ...view };
        (view.board as unknown[][])[0]?.fill(view.currentCard);
        return { row: 0, column: 4 };
      },
    };
    expect(askBotForMove(botThatScribblesOnItsView, state).ok).toBe(true);
    expect(Object.keys(whatTheBotSaw).sort()).toEqual([
      'board',
      'currentCard',
      'mySeat',
      'nextCard',
    ]);
    expect(state.board[0]?.[3]).toBeNull();
  });
});
