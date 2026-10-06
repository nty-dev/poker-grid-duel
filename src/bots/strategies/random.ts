import { emptyPositions } from '../../engine/gameState/readGameState';
import type { Rng } from '../../engine/types';
import type { Bot } from '../types';

export function createRandomBot(rng: Rng): Bot {
  return {
    chooseMove(view) {
      const empty = emptyPositions(view.board);
      const randomEmptyPosition = empty[rng.nextIntBelow(empty.length)];
      if (!randomEmptyPosition) throw new Error('Random was asked to move on a full board.');
      return randomEmptyPosition;
    },
  };
}
