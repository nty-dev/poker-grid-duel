const BOARD_SIZE = 5;

const POINTS_FOR_PAIR = 2;
const POINTS_FOR_TWO_PAIR = 5;
const POINTS_FOR_TRIPS = 10;
const POINTS_FOR_QUADS = 40;

const BONUS_PAIR_CAN_IMPROVE = 1;
const BONUS_TRIPS_CAN_IMPROVE = 3;
const BONUS_PER_CARD_TOWARDS_FLUSH = 1;
const BONUS_PER_CARD_TOWARDS_STRAIGHT = 1;
const MIN_CARDS_FOR_DRAW_BONUS = 2;

const RANKS_LOW_TO_HIGH = '23456789TJQKA';
const VALUE_OF_LOWEST_RANK = 2;
const ACE_HIGH = 14;
const ACE_LOW = 1;
const STRAIGHT_LENGTH = 5;

function chooseMove(view, helpers) {
  const myLineKind = view.mySeat === 'rows' ? 'row' : 'column';
  const opponentLineKind = myLineKind === 'row' ? 'column' : 'row';

  let bestPosition = null;
  let bestAdvantage = -Infinity;
  for (const position of helpers.emptyPositions(view.board)) {
    const boardAfter = helpers.place(view.board, position, view.currentCard);
    const myGain = lineWorthGained(view.board, boardAfter, position, myLineKind, helpers);
    const opponentGain = lineWorthGained(
      view.board,
      boardAfter,
      position,
      opponentLineKind,
      helpers,
    );
    const advantage = myGain - opponentGain;
    if (advantage > bestAdvantage) {
      bestPosition = position;
      bestAdvantage = advantage;
    }
  }
  return bestPosition;
}

function lineWorthGained(boardBefore, boardAfter, position, lineKind, helpers) {
  const lineNumber = lineKind === 'row' ? position.row : position.column;
  const lineBefore = helpers.lineOf(boardBefore, lineKind, lineNumber);
  const lineAfter = helpers.lineOf(boardAfter, lineKind, lineNumber);
  return lineWorth(lineAfter, helpers) - lineWorth(lineBefore, helpers);
}

function lineWorth(line, helpers) {
  const cards = line.filter((cell) => cell !== null);
  const isFinishedHand = cards.length === BOARD_SIZE;
  return isFinishedHand ? helpers.evaluateHand(cards).points : worthOfUnfinishedLine(cards);
}

function worthOfUnfinishedLine(cards) {
  let worth = worthOfSameRankGroups(rankGroupSizesLargestFirst(cards));
  if (cards.length >= MIN_CARDS_FOR_DRAW_BONUS) {
    const isAllOneSuit = cards.every((card) => card.suit === cards[0].suit);
    if (isAllOneSuit) worth += BONUS_PER_CARD_TOWARDS_FLUSH * cards.length;
    if (canStillBecomeStraight(cards)) worth += BONUS_PER_CARD_TOWARDS_STRAIGHT * cards.length;
  }
  return worth;
}

function worthOfSameRankGroups(groupSizesLargestFirst) {
  const [largestGroup = 0, secondGroup = 0] = groupSizesLargestFirst;
  if (largestGroup === 4) return POINTS_FOR_QUADS;
  if (largestGroup === 3) return POINTS_FOR_TRIPS + BONUS_TRIPS_CAN_IMPROVE;
  if (largestGroup === 2 && secondGroup === 2) return POINTS_FOR_TWO_PAIR + BONUS_PAIR_CAN_IMPROVE;
  if (largestGroup === 2) return POINTS_FOR_PAIR + BONUS_PAIR_CAN_IMPROVE;
  return 0;
}

function rankGroupSizesLargestFirst(cards) {
  const countByRank = {};
  for (const card of cards) countByRank[card.rank] = (countByRank[card.rank] || 0) + 1;
  return Object.values(countByRank).sort((a, b) => b - a);
}

function canStillBecomeStraight(cards) {
  const rankValues = cards.map(
    (card) => RANKS_LOW_TO_HIGH.indexOf(card.rank) + VALUE_OF_LOWEST_RANK,
  );
  const hasRepeatedRank = new Set(rankValues).size !== rankValues.length;
  if (hasRepeatedRank) return false;

  const highestStraightStart = ACE_HIGH - STRAIGHT_LENGTH + 1;
  for (let straightStart = ACE_LOW; straightStart <= highestStraightStart; straightStart++) {
    const straightEnd = straightStart + STRAIGHT_LENGTH - 1;
    const isAceLowStraight = straightStart === ACE_LOW;
    const fitsThisStraight = (value) =>
      (value >= straightStart && value <= straightEnd) || (isAceLowStraight && value === ACE_HIGH);
    if (rankValues.every(fitsThisStraight)) return true;
  }
  return false;
}
