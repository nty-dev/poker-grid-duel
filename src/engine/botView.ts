import { countPlacedCards, currentCard, nextCard } from './game';
import type { GameState, BotView, Seat } from './types';

export function toBotView(state: GameState, mySeat: Seat): BotView {
  const current = currentCard(state);
  if (!current) {
    throw new Error('toBotView was called on a finished game: there is no card left to place.');
  }
  return {
    board: state.board,
    mySeat,
    currentCard: current,
    nextCard: nextCard(state),
    moveNumber: countPlacedCards(state),
  };
}
