import { compareBySuitThenRank } from './deck';
import { countPlacedCards, currentCard, nextCard } from './game';
import type { GameState, BotView, Seat } from './types';

export function toBotView(state: GameState, mySeat: Seat): BotView {
  const current = currentCard(state);
  if (!current) {
    throw new Error('toBotView was called on a finished game: there is no card left to place.');
  }
  const next = nextCard(state);
  const dealtCount = countPlacedCards(state) + (next ? 2 : 1);
  return {
    board: state.board,
    mySeat,
    currentCard: current,
    nextCard: next,
    // Sorted, so the real order of the deck is not visible to the bot.
    unseenCards: state.deck.slice(dealtCount).sort(compareBySuitThenRank),
    moveNumber: countPlacedCards(state),
  };
}
