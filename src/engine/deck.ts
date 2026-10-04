import { type Rng, RANKS, SUITS, type Card } from './types';

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function fisherYatesShuffle<T>(items: readonly T[], rng: Rng): T[] {
  const shuffled = items.slice();
  for (let lastUnshuffled = shuffled.length - 1; lastUnshuffled > 0; lastUnshuffled--) {
    const randomIndexUpToLast = rng.nextIntBelow(lastUnshuffled + 1);
    swap(shuffled, lastUnshuffled, randomIndexUpToLast);
  }
  return shuffled;
}

function swap<T>(items: T[], first: number, second: number): void {
  const held = items[first] as T;
  items[first] = items[second] as T;
  items[second] = held;
}

export function compareBySuitThenRank(a: Card, b: Card): number {
  return a.suit === b.suit
    ? RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
    : SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
}
