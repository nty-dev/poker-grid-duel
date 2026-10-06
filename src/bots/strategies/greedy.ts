import { classifyHand } from '../../engine/evaluator';
import { emptyPositions, otherSeat } from '../../engine/gameState/readGameState';
import { BOARD_SIZE, HAND_POINTS } from '../../engine/rules';
import { lineCells } from '../../engine/scoring';
import {
  RANKS,
  type Board,
  type BotView,
  type Card,
  type Cell,
  type HandType,
  type Position,
  type Seat,
} from '../../engine/types';
import type { Bot } from '../types';

const BONUS_BECAUSE_HAND_CAN_IMPROVE: Partial<Record<HandType, number>> = {
  pair: 1,
  twoPair: 1,
  threeOfAKind: 3,
};
const BONUS_PER_CARD_TOWARDS_FLUSH = 1;
const BONUS_PER_CARD_TOWARDS_STRAIGHT = 1;
const MIN_CARDS_FOR_DRAW_BONUS = 2;

const VALUE_OF_LOWEST_RANK = 2;
const ACE_HIGH = 14;
const ACE_LOW = 1;
const STRAIGHT_LENGTH = 5;

export function createGreedyBot(): Bot {
  return { chooseMove };
}

function chooseMove(view: BotView): Position {
  const { board, mySeat, currentCard } = view;
  let bestPosition: Position | null = null;
  let bestAdvantage = -Infinity;
  for (const position of emptyPositions(board)) {
    const myGain = lineWorthGained(board, mySeat, position, currentCard);
    const opponentGain = lineWorthGained(board, otherSeat(mySeat), position, currentCard);
    const advantage = myGain - opponentGain;
    if (advantage > bestAdvantage) {
      bestPosition = position;
      bestAdvantage = advantage;
    }
  }
  if (!bestPosition) throw new Error('Greedy was asked to move on a full board.');
  return bestPosition;
}

function lineWorthGained(board: Board, seat: Seat, position: Position, card: Card): number {
  const lineNumber = seat === 'rows' ? position.row : position.column;
  const indexAlongLine = seat === 'rows' ? position.column : position.row;
  const lineBefore = lineCells(board, seat, lineNumber);
  const lineAfter = lineBefore.map((cell, index) => (index === indexAlongLine ? card : cell));
  return lineWorth(lineAfter) - lineWorth(lineBefore);
}

function lineWorth(line: readonly Cell[]): number {
  const cards = line.filter((cell): cell is Card => cell !== null);
  const isFinishedHand = cards.length === BOARD_SIZE;
  return isFinishedHand ? HAND_POINTS[classifyHand(cards)] : worthOfUnfinishedLine(cards);
}

function worthOfUnfinishedLine(cards: readonly Card[]): number {
  const handSoFar = classifyHand(cards);
  let worth = HAND_POINTS[handSoFar] + (BONUS_BECAUSE_HAND_CAN_IMPROVE[handSoFar] ?? 0);
  if (cards.length >= MIN_CARDS_FOR_DRAW_BONUS) {
    const isAllOneSuit = cards.every((card) => card.suit === cards[0]?.suit);
    if (isAllOneSuit) worth += BONUS_PER_CARD_TOWARDS_FLUSH * cards.length;
    if (canStillBecomeStraight(cards)) worth += BONUS_PER_CARD_TOWARDS_STRAIGHT * cards.length;
  }
  return worth;
}

function canStillBecomeStraight(cards: readonly Card[]): boolean {
  const rankValues = cards.map((card) => RANKS.indexOf(card.rank) + VALUE_OF_LOWEST_RANK);
  const hasRepeatedRank = new Set(rankValues).size !== rankValues.length;
  if (hasRepeatedRank) return false;

  const highestStraightStart = ACE_HIGH - STRAIGHT_LENGTH + 1;
  for (let straightStart = ACE_LOW; straightStart <= highestStraightStart; straightStart++) {
    const straightEnd = straightStart + STRAIGHT_LENGTH - 1;
    const isAceLowStraight = straightStart === ACE_LOW;
    const fitsThisStraight = (value: number) =>
      (value >= straightStart && value <= straightEnd) || (isAceLowStraight && value === ACE_HIGH);
    if (rankValues.every(fitsThisStraight)) return true;
  }
  return false;
}
