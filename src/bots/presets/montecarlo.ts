import { createDeck, fisherYatesShuffle } from '../../engine/deck';
import { emptyPositions, otherSeat } from '../../engine/gameState/readGameState';
import { BOARD_SIZE } from '../../engine/rules';
import { scoreBoard } from '../../engine/scoring';
import type { BotView, Card, Cell, Position, Rng, Seat } from '../../engine/types';
import type { Bot } from '../types';

const PLAYOUTS = 100;

const ALL_POSITIONS: Position[] = [];
for (let row = 0; row < BOARD_SIZE; row++) {
  for (let column = 0; column < BOARD_SIZE; column++) ALL_POSITIONS.push({ row, column });
}

interface SampledFuture {
  readonly cardsInDealOrder: readonly Card[];
  readonly positionsInFillOrder: readonly Position[];
}

export function createMonteCarloBot(rng: Rng): Bot {
  return { chooseMove: (view) => chooseMove(view, rng) };
}

function chooseMove(view: BotView, rng: Rng): Position {
  const sampledFutures = sampleFutures(view, rng);

  let bestPosition: Position | null = null;
  let bestTotalLead = -Infinity;
  for (const candidate of emptyPositions(view.board)) {
    let totalLead = 0;
    for (const future of sampledFutures) {
      const finalBoard = boardAfterRandomFinish(view, candidate, future);
      totalLead += myScoreLead(finalBoard, view.mySeat);
    }
    if (totalLead > bestTotalLead) {
      bestPosition = candidate;
      bestTotalLead = totalLead;
    }
  }
  if (!bestPosition) throw new Error('Monte Carlo was asked to move on a full board.');
  return bestPosition;
}

function sampleFutures(view: BotView, rng: Rng): SampledFuture[] {
  const unseenCards = cardsNotYetSeen(view);
  const futures: SampledFuture[] = [];
  for (let playout = 0; playout < PLAYOUTS; playout++) {
    const shuffledUnseen = fisherYatesShuffle(unseenCards, rng);
    futures.push({
      cardsInDealOrder: view.nextCard ? [view.nextCard, ...shuffledUnseen] : shuffledUnseen,
      positionsInFillOrder: fisherYatesShuffle(ALL_POSITIONS, rng),
    });
  }
  return futures;
}

function cardsNotYetSeen(view: BotView): Card[] {
  const label = (card: Card) => card.rank + card.suit;
  const seenCards = [...view.board.flat(), view.currentCard, view.nextCard];
  const seenLabels = new Set(seenCards.map((card) => card && label(card)));
  return createDeck().filter((card) => !seenLabels.has(label(card)));
}

function boardAfterRandomFinish(
  view: BotView,
  candidate: Position,
  future: SampledFuture,
): Cell[][] {
  const board = view.board.map((cellsInRow) => [...cellsInRow]);
  placeCard(board, candidate, view.currentCard);
  let cardsDealt = 0;
  for (const position of future.positionsInFillOrder) {
    const isEmpty = board[position.row]?.[position.column] === null;
    const nextCardToDeal = future.cardsInDealOrder[cardsDealt];
    if (isEmpty && nextCardToDeal) {
      placeCard(board, position, nextCardToDeal);
      cardsDealt++;
    }
  }
  return board;
}

function placeCard(board: Cell[][], { row, column }: Position, card: Card): void {
  const cellsInRow = board[row];
  if (cellsInRow) cellsInRow[column] = card;
}

function myScoreLead(fullBoard: Cell[][], mySeat: Seat): number {
  const { total } = scoreBoard(fullBoard);
  return total[mySeat] - total[otherSeat(mySeat)];
}
