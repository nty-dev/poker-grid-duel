/* exported chooseMove */

function chooseMove(view, helpers) {
  const emptyPositions = helpers.emptyPositions(view.board);
  return emptyPositions[Math.floor(helpers.random() * emptyPositions.length)];
}
