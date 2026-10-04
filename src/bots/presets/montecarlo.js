const PLAYOUTS = 100;
const BOARD_SIZE = 5;
const SUITS = 'SHDC';
const RANKS = '23456789TJQKA';

const ALL_POSITIONS = [];
for (let row = 0; row < BOARD_SIZE; row++) {
  for (let column = 0; column < BOARD_SIZE; column++) ALL_POSITIONS.push({ row, column });
}

function chooseMove(view, helpers) {
  const sampledFutures = sampleFutures(view, helpers);

  let bestPosition = null;
  let bestTotalLead = -Infinity;
  for (const candidate of helpers.emptyPositions(view.board)) {
    let totalLead = 0;
    for (const future of sampledFutures) {
      const finalBoard = boardAfterRandomFinish(view, candidate, future);
      totalLead += myScoreLead(finalBoard, view.mySeat, helpers);
    }
    if (totalLead > bestTotalLead) {
      bestPosition = candidate;
      bestTotalLead = totalLead;
    }
  }
  return bestPosition;
}

function sampleFutures(view, helpers) {
  const unseenCards = cardsNotYetSeen(view);
  const futures = [];
  for (let playout = 0; playout < PLAYOUTS; playout++) {
    const shuffledUnseen = helpers.shuffle(unseenCards);
    futures.push({
      cardsInDealOrder: view.nextCard ? [view.nextCard].concat(shuffledUnseen) : shuffledUnseen,
      positionsInFillOrder: helpers.shuffle(ALL_POSITIONS),
    });
  }
  return futures;
}

function cardsNotYetSeen(view) {
  const seenCards = view.board.flat().concat(view.currentCard, view.nextCard);
  const seenLabels = new Set(seenCards.map((card) => card && card.rank + card.suit));
  const unseenCards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (!seenLabels.has(rank + suit)) unseenCards.push({ rank, suit });
    }
  }
  return unseenCards;
}

function boardAfterRandomFinish(view, candidate, future) {
  const board = view.board.map((cellsInRow) => cellsInRow.slice());
  board[candidate.row][candidate.column] = view.currentCard;
  let cardsDealt = 0;
  for (const { row, column } of future.positionsInFillOrder) {
    const isEmpty = board[row][column] === null;
    if (isEmpty) board[row][column] = future.cardsInDealOrder[cardsDealt++];
  }
  return board;
}

function myScoreLead(board, mySeat, helpers) {
  let rowsScore = 0;
  let columnsScore = 0;
  for (let lineNumber = 0; lineNumber < BOARD_SIZE; lineNumber++) {
    rowsScore += helpers.evaluateHand(helpers.lineOf(board, 'row', lineNumber)).points;
    columnsScore += helpers.evaluateHand(helpers.lineOf(board, 'column', lineNumber)).points;
  }
  return mySeat === 'rows' ? rowsScore - columnsScore : columnsScore - rowsScore;
}
