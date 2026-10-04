import { describe, expect, it } from 'vitest';
import { createBotHelpers } from '../src/bots/api';
import { askBotForMove, compileTrustedBotSource, createBotPlayer } from '../src/bots/runner';
import { newGame } from '../src/engine/gameState/advanceGame';
import { toBotView } from '../src/engine/botView';
import { boardFrom, cards, EMPTY_ROWS, parseCard, stateFrom } from './helpers';

describe('bot helpers', () => {
  const helpers = createBotHelpers(1);
  const board = boardFrom(['AS 2S . . .', ...EMPTY_ROWS.slice(1)]);
  const nineOfDiamonds = parseCard('9D');

  it('evaluateHand returns the hand and its points', () => {
    expect(helpers.evaluateHand(cards('2H 7H 9H JH KH'))).toEqual({ hand: 'flush', points: 12 });
  });

  it('place returns a new board and leaves the original alone', () => {
    const after = helpers.place(board, { row: 0, column: 2 }, nineOfDiamonds);
    expect(after[0]?.[2]).toEqual(nineOfDiamonds);
    expect(board[0]?.[2]).toBeNull();
  });

  it('throw on misuse instead of returning nonsense', () => {
    expect(() => helpers.evaluateHand(cards('AS AH'))).toThrow(/exactly 5/);
    expect(() => helpers.place(board, { row: 0, column: 0 }, nineOfDiamonds)).toThrow(/occupied/);
    expect(() => helpers.place(board, { row: 5, column: 0 }, nineOfDiamonds)).toThrow(/position/);
    expect(() => helpers.lineOf(board, 'row', 5)).toThrow(/line number/);
    expect(() => helpers.lineOf(board, 'diagonal' as 'row', 0)).toThrow(/kind/);
  });

  it('random and shuffle repeat exactly for the same seed', () => {
    expect(createBotHelpers(42).random()).toBe(createBotHelpers(42).random());
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = createBotHelpers(7).shuffle(items);
    expect(createBotHelpers(7).shuffle(items)).toEqual(shuffled);
    expect([...shuffled].sort()).toEqual(items);
  });
});

describe('running a bot', () => {
  const aceInTopLeft = ['AS . . . .', ...EMPTY_ROWS.slice(1)];
  const view = toBotView(stateFrom(aceInTopLeft, '2C', '3C'), 'rows');
  const askBotWithBody = (body: string) =>
    askBotForMove(
      compileTrustedBotSource(`function chooseMove(view, helpers) { ${body} }`),
      view,
      createBotHelpers(1),
    );

  it('refuses source that does not define chooseMove', () => {
    expect(() => compileTrustedBotSource('function choose() { return 0; }')).toThrow(/chooseMove/);
  });

  it('accepts the position of an empty cell', () => {
    expect(askBotWithBody('return { row: 0, column: 1 };')).toEqual({
      ok: true,
      position: { row: 0, column: 1 },
    });
  });

  it('turns a thrown error into a forfeit', () => {
    expect(askBotWithBody('throw new Error("boom");')).toEqual({
      ok: false,
      reason: 'exception',
      detail: 'Error: boom',
    });
  });

  it.each([
    ['an occupied cell', 'return { row: 0, column: 0 };', 'returned {"row":0,"column":0}'],
    ['a cell off the board', 'return { row: 5, column: 0 };', 'returned {"row":5,"column":0}'],
    [
      'text for a row, without coercing it',
      'return { row: "0", column: 1 };',
      'returned {"row":"0","column":1}',
    ],
    ['a bare number', 'return 7;', 'returned 7'],
    ['nothing', 'return undefined;', 'returned undefined'],
    [
      'an object that contains itself, which JSON cannot print',
      'const loop = {}; loop.self = loop; return loop;',
      'returned [object Object]',
    ],
  ])('turns %s into a forfeit', (_what, body, detail) => {
    expect(askBotWithBody(body)).toEqual({ ok: false, reason: 'invalid_move', detail });
  });

  it('gives the bot a copy of the view, so the bot cannot change the game', () => {
    const cheat = createBotPlayer(
      'function chooseMove(view) { view.board[0][3] = view.currentCard; return { row: 0, column: 4 }; }',
      1,
    );
    const realView = toBotView(newGame({ seed: 1, firstMover: 'rows' }), 'rows');
    expect(cheat.chooseMove(realView)).toEqual({ ok: true, position: { row: 0, column: 4 } });
    expect(realView.board[0]?.[3]).toBeNull();
  });
});
