/* exported chooseMove */
// Monte Carlo cannot see the order of the deck, so it samples it. For every
// empty position it places the current card there, finishes the game at random
// PLAYOUTS times, and keeps the position with the best total of
// (my final score − opponent's final score).

const PLAYOUTS = 100;
const BOARD_SIZE = 5;

const ALL_POSITIONS = [];
for (let row = 0; row < BOARD_SIZE; row++) {
  for (let column = 0; column < BOARD_SIZE; column++) ALL_POSITIONS.push({ row, column });
}

function chooseMove(view, helpers) {
  // Every candidate position is judged on the same sampled futures. Otherwise
  // one could look better only because it happened to draw luckier cards.
  const sampledFutures = [];
  for (let playout = 0; playout < PLAYOUTS; playout++) {
    const shuffledUnseen = helpers.shuffle(view.unseenCards);
    sampledFutures.push({
      cardsToCome: view.nextCard ? [view.nextCard].concat(shuffledUnseen) : shuffledUnseen,
      fillOrder: helpers.shuffle(ALL_POSITIONS),
    });
  }

  let bestPosition = null;
  let bestTotalLead = -Infinity;
  for (const position of helpers.emptyPositions(view.board)) {
    let totalLead = 0;
    for (const future of sampledFutures) {
      totalLead += myLeadAfterRandomFinish(view, position, future, helpers);
    }
    if (totalLead > bestTotalLead) {
      bestPosition = position;
      bestTotalLead = totalLead;
    }
  }
  return bestPosition;
}

// When both sides play at random, it does not matter who places which card:
// the cards to come simply land on the empty positions in a random order.
function myLeadAfterRandomFinish(view, candidate, future, helpers) {
  const board = view.board.map((cellsInRow) => cellsInRow.slice());
  board[candidate.row][candidate.column] = view.currentCard;
  let cardsDrawn = 0;
  for (const { row, column } of future.fillOrder) {
    if (board[row][column] === null) board[row][column] = future.cardsToCome[cardsDrawn++];
  }

  let rowsScore = 0;
  let columnsScore = 0;
  for (let lineNumber = 0; lineNumber < BOARD_SIZE; lineNumber++) {
    rowsScore += helpers.evaluateHand(helpers.lineOf(board, 'row', lineNumber)).points;
    columnsScore += helpers.evaluateHand(helpers.lineOf(board, 'column', lineNumber)).points;
  }
  return view.mySeat === 'rows' ? rowsScore - columnsScore : columnsScore - rowsScore;
}
