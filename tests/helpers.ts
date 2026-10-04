import { createDeck } from '../src/engine/deck';
import { newGame, step } from '../src/engine/game';
import type {
  Board,
  Card,
  GameConfig,
  GameState,
  Move,
  Seat,
  StepResult,
} from '../src/engine/types';

/** Short label such as "AS", "TH", "7C". */
export function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(label: string): Card {
  const card = createDeck().find((c) => cardLabel(c) === label);
  if (!card) throw new Error(`Bad card label: ${label}`);
  return card;
}

/** Plays `moves` from a new game. Returns the first error encountered, if any. */
export function replay(config: GameConfig, moves: readonly Move[]): StepResult {
  let state = newGame(config);
  for (const move of moves) {
    const result = step(state, move);
    if (!result.ok) return result;
    state = result.state;
  }
  return { ok: true, state };
}

export const cards = (labels: string): Card[] =>
  labels
    .split(' ')
    .filter(Boolean)
    .map((l) => parseCard(l));

/**
 * Builds a board from 5 strings of 5 space-separated tokens:
 * "." = empty, otherwise a card label such as "AS" or "TH".
 */
export function boardFrom(rows: readonly string[]): Board {
  return rows.map((row) =>
    row
      .split(' ')
      .filter(Boolean)
      .map((token) => (token === '.' ? null : parseCard(token))),
  );
}

/**
 * A hand-built mid-game state. The deck is ordered as it would have been
 * dealt: the cards already on the board, then the current and next cards,
 * then everything else.
 */
export function stateFrom(
  rows: readonly string[],
  current: string,
  next: string,
  toMove: Seat = 'rows',
): GameState {
  const board = boardFrom(rows);
  const alreadyPlaced = board.flat().filter((cell): cell is Card => cell !== null);
  const dealt = [...alreadyPlaced, parseCard(current), parseCard(next)];
  const dealtLabels = new Set(dealt.map(cardLabel));
  const undealt = createDeck().filter((card) => !dealtLabels.has(cardLabel(card)));
  return { board, deck: [...dealt, ...undealt], toMove };
}

export const EMPTY_ROWS = ['. . . . .', '. . . . .', '. . . . .', '. . . . .', '. . . . .'];
