import type { BotPlayer } from '../bots/types';

export interface MoveTimer {
  totalMs: number;
  moves: number;
}

export function newMoveTimer(): MoveTimer {
  return { totalMs: 0, moves: 0 };
}

export function withMoveTimer(bot: BotPlayer, timer: MoveTimer): BotPlayer {
  return {
    chooseMove(view, randomSeed) {
      const startedAt = performance.now();
      const decision = bot.chooseMove(view, randomSeed);
      timer.totalMs += performance.now() - startedAt;
      timer.moves++;
      return decision;
    },
  };
}

export function averageMsPerMove(timer: MoveTimer): number {
  return timer.moves === 0 ? 0 : timer.totalMs / timer.moves;
}
