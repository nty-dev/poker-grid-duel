function chooseMove(view, helpers) {
  const emptyPositions = helpers.emptyPositions(view.board);
  const randomIndex = Math.floor(helpers.random() * emptyPositions.length);
  return emptyPositions[randomIndex];
}
