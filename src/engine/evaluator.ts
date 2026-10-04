import { BOARD_SIZE } from './rules';
import { RANKS, type Card, type HandType, type Rank } from './types';

export function classifyHand(cards: readonly Card[]): HandType {
  const [largestGroup = 0, secondGroup = 0] = rankGroupSizesLargestFirst(cards);
  if (largestGroup === 4) return 'fourOfAKind';
  if (largestGroup === 3 && secondGroup === 2) return 'fullHouse';
  if (largestGroup === 3) return 'threeOfAKind';
  if (largestGroup === 2 && secondGroup === 2) return 'twoPair';
  if (largestGroup === 2) return 'pair';
  const isUnfinishedLine = cards.length < BOARD_SIZE;
  return isUnfinishedLine ? 'highCard' : classifyStraightOrFlush(cards);
}

function classifyStraightOrFlush(cards: readonly Card[]): HandType {
  const isFlush = isFlushFun(cards);
  const isStraight = isStraightFun(cards);
  if (isFlush && isStraight) return 'straightFlush';
  if (isStraight) return 'straight';
  if (isFlush) return 'flush';
  return 'highCard';
}

function isFlushFun(cards: readonly Card[]): boolean {
  return cards.every((card) => card.suit === cards[0]?.suit);
}

function rankGroupSizesLargestFirst(cards: readonly Card[]): number[] {
  const countByRank = new Map<Rank, number>();
  for (const card of cards) countByRank.set(card.rank, (countByRank.get(card.rank) ?? 0) + 1);
  return [...countByRank.values()].sort((a, b) => b - a);
}

const RANK_INDEX_OF_TWO = RANKS.indexOf('2');
const RANK_INDEX_OF_FIVE = RANKS.indexOf('5');
const RANK_INDEX_OF_ACE = RANKS.indexOf('A');

function isStraightFun(cards: readonly Card[]): boolean {
  const rankIndexes = cards.map((card) => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
  const [lowest = 0, , , secondHighest = 0, highest = 0] = rankIndexes;
  const isUnbrokenRun = highest - lowest === 4;
  const isAceLowStraight =
    lowest === RANK_INDEX_OF_TWO &&
    secondHighest === RANK_INDEX_OF_FIVE &&
    highest === RANK_INDEX_OF_ACE;
  return isUnbrokenRun || isAceLowStraight;
}
