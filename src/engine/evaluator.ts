import { BOARD_SIZE } from './rules';
import { RANKS, type Card, type HandType, type Rank } from './types';

// Rank hands are checked first, and that is safe: with one deck, a hand that
// contains a pair cannot also be a flush or a straight.
export function classifyHand(cards: readonly Card[]): HandType {
  const [largestGroup = 0, secondGroup = 0] = sameRankGroupSizesDescending(cards);
  if (largestGroup === 4) return 'fourOfAKind';
  if (largestGroup === 3 && secondGroup === 2) return 'fullHouse';
  if (largestGroup === 3) return 'threeOfAKind';
  if (largestGroup === 2 && secondGroup === 2) return 'twoPair';
  if (largestGroup === 2) return 'pair';
  const isUnfinishedLine = cards.length < BOARD_SIZE;
  if (isUnfinishedLine) return 'highCard';

  const isFlush = cards.every((card) => card.suit === cards[0]?.suit);
  const isStraight = fiveDistinctRanksAreConsecutive(cards);
  if (isFlush && isStraight) return 'straightFlush';
  if (isStraight) return 'straight';
  if (isFlush) return 'flush';
  return 'highCard';
}

function sameRankGroupSizesDescending(cards: readonly Card[]): number[] {
  const countByRank = new Map<Rank, number>();
  for (const card of cards) countByRank.set(card.rank, (countByRank.get(card.rank) ?? 0) + 1);
  return [...countByRank.values()].sort((a, b) => b - a);
}

const POSITION_OF_TWO = RANKS.indexOf('2');
const POSITION_OF_FIVE = RANKS.indexOf('5');
const POSITION_OF_ACE = RANKS.indexOf('A');

function fiveDistinctRanksAreConsecutive(cards: readonly Card[]): boolean {
  const positions = cards.map((card) => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
  const [lowest = 0, , , secondHighest = 0, highest = 0] = positions;
  const isUnbrokenRun = highest - lowest === 4;
  const isAceLowStraight =
    lowest === POSITION_OF_TWO && secondHighest === POSITION_OF_FIVE && highest === POSITION_OF_ACE;
  return isUnbrokenRun || isAceLowStraight;
}
