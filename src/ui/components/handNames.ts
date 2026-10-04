import type { HandType } from '../../engine/types';

export const HAND_NAME: Record<HandType, string> = {
  highCard: '—',
  pair: 'Pair',
  twoPair: 'Two pair',
  threeOfAKind: 'Trips',
  flush: 'Flush',
  straight: 'Straight',
  fullHouse: 'Full house',
  fourOfAKind: 'Quads',
  straightFlush: 'Str. flush',
};
