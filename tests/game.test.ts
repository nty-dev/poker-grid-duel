import { describe, expect, it } from 'vitest';
import {
  currentCard,
  emptyPositions,
  isGameOver,
  newGame,
  nextCard,
  step,
} from '../src/engine/game';
import { createRng } from '../src/engine/rng';
import type { Cell, GameState, Move, Position } from '../src/engine/types';
import { toBotView } from '../src/engine/botView';
import { cardLabel, replay } from './helpers';

function mustStep(state: GameState, move: Move): GameState {
  const stepped = step(state, move);
  if (!stepped.ok) throw new Error(`unexpected error ${stepped.error}`);
  return stepped.state;
}

function playRandomGame(seed: number): { moves: Move[]; final: GameState } {
  const rng = createRng(seed);
  let state = newGame({ seed, firstMover: 'rows' });
  const moves: Move[] = [];
  while (!isGameOver(state)) {
    const empty = emptyPositions(state.board);
    const position = empty[rng.nextIntBelow(empty.length)] as Position;
    const move = { seat: state.toMove, position };
    moves.push(move);
    state = mustStep(state, move);
  }
  return { moves, final: state };
}

describe('newGame', () => {
  it('deals an empty board and all 52 cards, and gives the first move to the chosen seat', () => {
    const state = newGame({ seed: 42, firstMover: 'columns' });
    expect(state.board).toHaveLength(5);
    expect(state.board.flat()).toEqual(Array(25).fill(null));
    expect(new Set(state.deck.map(cardLabel)).size).toBe(52);
    expect(state.toMove).toBe('columns');
  });

  it('the seed alone decides the deal', () => {
    const deckFor = (seed: number, firstMover: 'rows' | 'columns') =>
      newGame({ seed, firstMover }).deck;
    expect(deckFor(7, 'rows')).toEqual(deckFor(7, 'columns'));
    expect(deckFor(7, 'rows')).not.toEqual(deckFor(8, 'rows'));
  });
});

describe('step', () => {
  const start = newGame({ seed: 1, firstMover: 'rows' });

  it('places the current card, moves on to the next card and passes the turn', () => {
    const after = mustStep(start, { seat: 'rows', position: { row: 2, column: 3 } });
    expect(after.board[2]?.[3]).toEqual(currentCard(start));
    expect(currentCard(after)).toEqual(nextCard(start));
    expect(after.toMove).toBe('columns');
  });

  it('does not change the state it was given, and shares the deck with the new state', () => {
    const before = JSON.stringify(start);
    const after = mustStep(start, { seat: 'rows', position: { row: 0, column: 3 } });
    expect(JSON.stringify(start)).toBe(before);
    expect(after.deck).toBe(start.deck);
  });

  it('rejects a move by the seat whose turn it is not', () => {
    expect(step(start, { seat: 'columns', position: { row: 0, column: 0 } })).toEqual({
      ok: false,
      error: 'notYourTurn',
    });
  });

  it.each([
    { row: -1, column: 0 },
    { row: 0, column: 5 },
    { row: 2.5, column: 0 },
  ])('rejects %j as not on the board', (position) => {
    expect(step(start, { seat: 'rows', position })).toEqual({ ok: false, error: 'notOnBoard' });
  });

  it('rejects an occupied cell', () => {
    const position = { row: 1, column: 0 };
    const after = mustStep(start, { seat: 'rows', position });
    expect(step(after, { seat: 'columns', position })).toEqual({
      ok: false,
      error: 'cellOccupied',
    });
  });

  it('rejects any move once the board is full', () => {
    const { final } = playRandomGame(3);
    expect(step(final, { seat: final.toMove, position: { row: 0, column: 0 } })).toEqual({
      ok: false,
      error: 'gameOver',
    });
  });
});

describe('a whole game', () => {
  it('takes 25 alternating moves and uses exactly the first 25 cards of the deck', () => {
    const { moves, final } = playRandomGame(5);
    expect(moves.map((move) => move.seat)).toEqual(
      Array.from({ length: 25 }, (_, turn) => (turn % 2 === 0 ? 'rows' : 'columns')),
    );
    const sortedLabels = (cells: readonly Cell[]) =>
      cells.map((card) => card && cardLabel(card)).sort();
    expect(sortedLabels(final.board.flat())).toEqual(sortedLabels(final.deck.slice(0, 25)));
    expect(currentCard(final)).toBeNull();
  });

  it('is fully determined by seed, first mover and moves', () => {
    const { moves, final } = playRandomGame(99);
    expect(replay({ seed: 99, firstMover: 'rows' }, moves)).toEqual({ ok: true, state: final });
  });
});

describe('toBotView', () => {
  const state = newGame({ seed: 10, firstMover: 'rows' });

  it('shows the board, the current and next cards, the seat and the move number', () => {
    expect(toBotView(state, 'columns')).toEqual({
      board: state.board,
      mySeat: 'columns',
      currentCard: state.deck[0],
      nextCard: state.deck[1],
      moveNumber: 0,
    });
  });

  it('is identical for two decks that differ only in the order of the hidden cards', () => {
    const [current, next, ...hidden] = state.deck;
    if (!current || !next) throw new Error('deck too short');
    const sameCardsOtherOrder = { ...state, deck: [current, next, ...hidden.reverse()] };
    expect(toBotView(sameCardsOtherOrder, 'rows')).toEqual(toBotView(state, 'rows'));
  });

  it('has no next card on the last turn', () => {
    const { moves } = playRandomGame(8);
    const beforeLastMove = replay({ seed: 8, firstMover: 'rows' }, moves.slice(0, 24));
    if (!beforeLastMove.ok) throw new Error('replay failed');
    const view = toBotView(beforeLastMove.state, beforeLastMove.state.toMove);
    expect(view.nextCard).toBeNull();
  });
});
