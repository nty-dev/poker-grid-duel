import { createDeck } from '../src/engine/deck';
import { newGame, step } from '../src/engine/gameState/advanceGame';
import type {
  Board,
  Card,
  GameConfig,
  GameState,
  Move,
  Seat,
  StepResult,
} from '../src/engine/types';

export function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(label: string): Card {
  const card = createDeck().find((c) => cardLabel(c) === label);
  if (!card) throw new Error(`Bad card label: ${label}`);
  return card;
}

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

const EMPTY_CELL_MARK = '.';

export function boardFrom(rows: readonly string[]): Board {
  return rows.map((row) =>
    row
      .split(' ')
      .filter(Boolean)
      .map((token) => (token === EMPTY_CELL_MARK ? null : parseCard(token))),
  );
}

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
