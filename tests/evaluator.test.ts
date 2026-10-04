import { describe, expect, it } from 'vitest';
import { classifyHand } from '../src/engine/evaluator';
import type { HandType } from '../src/engine/types';
import { cards } from './helpers';

describe('classifyHand', () => {
  const fiveCardHands: [string, HandType][] = [
    ['2S 7H 9D JC KS', 'highCard'],
    ['2S 2H 9D JC KS', 'pair'],
    ['2S 2H 9D 9C KS', 'twoPair'],
    ['2S 2H 2D JC KS', 'threeOfAKind'],
    ['2H 7H 9H JH KH', 'flush'],
    ['5S 6H 7D 8C 9S', 'straight'],
    ['2S 2H 2D KC KS', 'fullHouse'],
    ['2S 2H 2D 2C KS', 'fourOfAKind'],
    ['5H 6H 7H 8H 9H', 'straightFlush'],
  ];
  it.each(fiveCardHands)('%s is %s', (labels, expected) => {
    expect(classifyHand(cards(labels))).toBe(expected);
  });

  const aceStraights: [string, HandType][] = [
    ['TS JH QD KC AS', 'straight'],
    ['AS 2H 3D 4C 5S', 'straight'],
    ['QS KH AD 2C 3S', 'highCard'],
  ];
  it.each(aceStraights)(
    'the ace is high or low but does not wrap: %s is %s',
    (labels, expected) => {
      expect(classifyHand(cards(labels))).toBe(expected);
    },
  );

  it('ignores the order of the cards', () => {
    expect(classifyHand(cards('9S 5H 8D 6C 7S'))).toBe('straight');
  });

  const unfinishedLines: [string, HandType][] = [
    ['', 'highCard'],
    ['AS AH', 'pair'],
    ['AS AH AD AC', 'fourOfAKind'],
    ['5H 6H 7H 8H', 'highCard'],
  ];
  it.each(unfinishedLines)(
    'an unfinished line only makes rank hands: "%s" is %s',
    (labels, expected) => {
      expect(classifyHand(cards(labels))).toBe(expected);
    },
  );
});
