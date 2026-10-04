import { isOnBoard } from '../engine/game';
import type { BotView, Position, Seed } from '../engine/types';
import { createHelpers } from './api';
import type { BotHelpers, ChooseMove, BotDecision, BotPlayer } from './types';

export function compileTrustedBotSource(source: string): ChooseMove {
  const returnChooseMove = new Function(
    `"use strict";\n${source}\n;return typeof chooseMove === "function" ? chooseMove : undefined;`,
  ) as () => unknown;
  const chooseMove = returnChooseMove();
  if (typeof chooseMove !== 'function') {
    throw new TypeError('Bot source must define function chooseMove(view, helpers)');
  }
  return chooseMove as ChooseMove;
}

function describeForMessage(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  // JSON shows quotes around strings and the contents of objects. String() is
  // for the rest, because JSON prints NaN as null and drops undefined.
  const isStringOrObject =
    typeof value === 'string' || (typeof value === 'object' && value !== null);
  return isStringOrObject ? JSON.stringify(value) : String(value);
}

function hasNumericRowAndColumn(answer: unknown): answer is Position {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'row' in answer &&
    'column' in answer &&
    typeof answer.row === 'number' &&
    typeof answer.column === 'number'
  );
}

function acceptOnlyEmptyPosition(view: BotView, answer: unknown): BotDecision {
  const isEmptyPositionOnBoard =
    hasNumericRowAndColumn(answer) &&
    isOnBoard(answer) &&
    view.board[answer.row]?.[answer.column] === null;
  if (isEmptyPositionOnBoard) {
    return { ok: true, position: { row: answer.row, column: answer.column } };
  }
  return { ok: false, reason: 'invalid_move', detail: `returned ${describeForMessage(answer)}` };
}

export function askBotForMove(
  chooseMove: ChooseMove,
  view: BotView,
  helpers: BotHelpers,
): BotDecision {
  let answer: unknown;
  try {
    answer = chooseMove(view, helpers);
  } catch (thrown) {
    return { ok: false, reason: 'exception', detail: describeForMessage(thrown) };
  }
  return acceptOnlyEmptyPosition(view, answer);
}

export function createBotPlayer(source: string): BotPlayer {
  const chooseMove = compileTrustedBotSource(source);
  return {
    // The bot gets a copy of the view, so it cannot change the real game state.
    chooseMove: (view, randomSeed) =>
      askBotForMove(chooseMove, structuredClone(view), createHelpers(randomSeed)),
  };
}

export function seedForMove(gameSeed: number, moveNumber: number): Seed {
  return `${gameSeed}/move-${moveNumber}`;
}
