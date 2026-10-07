import { toBotView } from '../engine/botView';
import { isOnBoard } from '../engine/gameState/readGameState';
import type { BotView, GameState, Position } from '../engine/types';
import type { Bot, BotDecision } from './types';

function describeThrown(thrown: unknown): string {
  return thrown instanceof Error ? `${thrown.name}: ${thrown.message}` : String(thrown);
}

function validateBotAnswer(view: BotView, position: Position | null | undefined): BotDecision {
  if (!position) {
    return {
      ok: false,
      reason: 'invalid_move',
      detail: `returned ${String(position)} instead of a position`,
    };
  }
  const { row, column } = position;
  const isEmptyCell = isOnBoard(position) && view.board[row]?.[column] === null;
  if (isEmptyCell) return { ok: true, position: { row, column } };
  return {
    ok: false,
    reason: 'invalid_move',
    detail: `chose row ${row}, column ${column}, which is not an empty cell`,
  };
}

export function askBotForMove(bot: Bot, state: GameState): BotDecision {
  const view = toBotView(state, state.toMove);
  const cloneOfView = structuredClone(view);
  let answer: Position | null | undefined;
  try {
    answer = bot.chooseMove(cloneOfView);
  } catch (thrown) {
    return { ok: false, reason: 'exception', detail: describeThrown(thrown) };
  }
  return validateBotAnswer(view, answer);
}
