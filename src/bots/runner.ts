import { isOnBoard } from '../engine/gameState/readGameState';
import type { BotView, Position, Seed } from '../engine/types';
import { createBotHelpers } from './api';
import type { BotHelpers, ChooseMove, BotDecision, BotPlayer } from './types';

export function compileTrustedBotSource(source: string): ChooseMove {
  const extractChooseMove = new Function(
    `"use strict";\n${source}\n;return typeof chooseMove === "function" ? chooseMove : undefined;`,
  ) as () => unknown;
  const chooseMove = extractChooseMove();
  if (typeof chooseMove !== 'function') {
    throw new TypeError('Bot source must define function chooseMove(view, helpers)');
  }
  return chooseMove as ChooseMove;
}

function toJsonIfPossible(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function describeBotOutput(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  return toJsonIfPossible(value) ?? String(value);
}

function isValidPosition(answer: unknown): answer is Position {
  if (typeof answer !== 'object' || answer === null) return false;
  const { row, column } = answer as Partial<Position>;
  return typeof row === 'number' && typeof column === 'number' && isOnBoard({ row, column });
}

function validateBotAnswer(view: BotView, answer: unknown): BotDecision {
  const isEmptyCell = isValidPosition(answer) && view.board[answer.row]?.[answer.column] === null;
  if (isEmptyCell) {
    return { ok: true, position: { row: answer.row, column: answer.column } };
  }
  return { ok: false, reason: 'invalid_move', detail: `returned ${describeBotOutput(answer)}` };
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
    return { ok: false, reason: 'exception', detail: describeBotOutput(thrown) };
  }
  return validateBotAnswer(view, answer);
}

export function createBotPlayer(source: string, rngSeed: Seed): BotPlayer {
  const chooseMove = compileTrustedBotSource(source);
  const helpers = createBotHelpers(rngSeed);
  return {
    chooseMove: (view) => {
      const cloneOfView = structuredClone(view);
      return askBotForMove(chooseMove, cloneOfView, helpers);
    },
  };
}
