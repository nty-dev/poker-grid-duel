/* exported chooseMove */
// Greedy tries the current card in every empty position and keeps the one where
// (gain to my line) − (gain to the opponent's line) is largest. Placing a card
// only changes the row and the column through that position, so only those two
// lines are scored. It does not look ahead to the next card.

const BOARD_SIZE = 5;

// An unfinished line is worth what it already holds, plus a bonus for each
// way it can still improve. The bonuses are small, so a finished hand always
// outranks a hope.
const BONUS_PER_CARD_TOWARDS_FLUSH = 1;
const BONUS_PER_CARD_TOWARDS_STRAIGHT = 1;
const BONUS_PAIR_CAN_IMPROVE = 1;
const BONUS_TRIPS_CAN_IMPROVE = 3;

const POINTS_FOR_PAIR = 2;
const POINTS_FOR_TWO_PAIR = 5;
const POINTS_FOR_TRIPS = 10;
const POINTS_FOR_QUADS = 40;

const RANKS_LOW_TO_HIGH = '23456789TJQKA';
const ACE_HIGH = 14;
const ACE_LOW = 1;

function chooseMove(view, helpers) {
  const myLineKind = view.mySeat === 'rows' ? 'row' : 'column';
  const opponentLineKind = myLineKind === 'row' ? 'column' : 'row';

  let bestPosition = null;
  let bestAdvantage = -Infinity;
  for (const position of helpers.emptyPositions(view.board)) {
    const boardAfter = helpers.place(view.board, position, view.currentCard);
    const advantage =
      worthGained(view.board, boardAfter, position, myLineKind, helpers) -
      worthGained(view.board, boardAfter, position, opponentLineKind, helpers);
    if (advantage > bestAdvantage) {
      bestPosition = position;
      bestAdvantage = advantage;
    }
  }
  return bestPosition;
}

function worthGained(boardBefore, boardAfter, position, lineKind, helpers) {
  const lineNumber = lineKind === 'row' ? position.row : position.column;
  return (
    lineWorth(helpers.lineOf(boardAfter, lineKind, lineNumber), helpers) -
    lineWorth(helpers.lineOf(boardBefore, lineKind, lineNumber), helpers)
  );
}

function lineWorth(line, helpers) {
  const cards = line.filter((cell) => cell !== null);
  if (cards.length === BOARD_SIZE) return helpers.evaluateHand(cards).points;

  let worth = worthOfSameRankGroups(sameRankGroupSizesDescending(cards));
  if (cards.length >= 2) {
    const allOneSuit = cards.every((card) => card.suit === cards[0].suit);
    if (allOneSuit) worth += BONUS_PER_CARD_TOWARDS_FLUSH * cards.length;
    if (canStillBecomeStraight(cards)) worth += BONUS_PER_CARD_TOWARDS_STRAIGHT * cards.length;
  }
  return worth;
}

function worthOfSameRankGroups(groupSizesDescending) {
  const [largestGroup = 0, secondGroup = 0] = groupSizesDescending;
  if (largestGroup === 4) return POINTS_FOR_QUADS;
  if (largestGroup === 3) return POINTS_FOR_TRIPS + BONUS_TRIPS_CAN_IMPROVE;
  if (largestGroup === 2 && secondGroup === 2) return POINTS_FOR_TWO_PAIR + BONUS_PAIR_CAN_IMPROVE;
  if (largestGroup === 2) return POINTS_FOR_PAIR + BONUS_PAIR_CAN_IMPROVE;
  return 0;
}

function sameRankGroupSizesDescending(cards) {
  const countByRank = {};
  for (const card of cards) countByRank[card.rank] = (countByRank[card.rank] || 0) + 1;
  return Object.values(countByRank).sort((a, b) => b - a);
}

function canStillBecomeStraight(cards) {
  const rankValues = cards.map((card) => RANKS_LOW_TO_HIGH.indexOf(card.rank) + 2);
  const hasRepeatedRank = new Set(rankValues).size !== rankValues.length;
  if (hasRepeatedRank) return false;

  const startOfHighestWindow = ACE_HIGH - 4;
  for (let windowStart = ACE_LOW; windowStart <= startOfHighestWindow; windowStart++) {
    const isInsideWindow = (value) => value >= windowStart && value <= windowStart + 4;
    const isAceCountedLow = (value) => value === ACE_HIGH && windowStart === ACE_LOW;
    const allRanksFitThisWindow = rankValues.every(
      (value) => isInsideWindow(value) || isAceCountedLow(value),
    );
    if (allRanksFitThisWindow) return true;
  }
  return false;
}
