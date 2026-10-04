import type { HandType } from './types';

export const BOARD_SIZE = 5;

export const HAND_POINTS: Readonly<Record<HandType, number>> = {
  highCard: 0,
  pair: 2,
  twoPair: 5,
  threeOfAKind: 10,
  flush: 12,
  straight: 15,
  fullHouse: 20,
  fourOfAKind: 40,
  straightFlush: 60,
};
