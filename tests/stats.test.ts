import { describe, expect, it } from 'vitest';
import type { GameRecord, GameResult } from '../src/evaluation/match';
import {
  eloGapFromScoreRate,
  confidenceInterval95OfMean,
  pairScoresForA,
  sampleStandardDeviation,
  scoreForA,
  summarizeMatch,
} from '../src/evaluation/stats';

const gameWith = (result: GameResult): GameRecord => ({
  config: { seed: 1, firstMover: 'rows' },
  seatOfA: 'rows',
  result,
});
const win = gameWith({ kind: 'finished', points: { A: 10, B: 4 } });
const loss = gameWith({ kind: 'finished', points: { A: 2, B: 7 } });
const draw = gameWith({ kind: 'finished', points: { A: 5, B: 5 } });
const forfeitByA = gameWith({ kind: 'forfeit', by: 'A', reason: 'invalid_move', detail: '' });
const forfeitByB = gameWith({ kind: 'forfeit', by: 'B', reason: 'exception', detail: '' });

describe('scoreForA', () => {
  it('is 1 for a win, ½ for a draw, 0 for a loss, and a forfeit loses', () => {
    expect([win, draw, loss, forfeitByA, forfeitByB].map(scoreForA)).toEqual([1, 0.5, 0, 0, 1]);
  });
});

describe('pairScoresForA', () => {
  it('averages the two games of each pair', () => {
    expect(
      pairScoresForA([
        [win, loss],
        [draw, win],
        [win, win],
      ]),
    ).toEqual([0.5, 0.75, 1]);
  });
});

describe('the 95% interval', () => {
  it('gives the textbook answer for the samples 1, 2, 3, 4', () => {
    expect(sampleStandardDeviation([1, 2, 3, 4])).toBeCloseTo(1.29099, 5);
    const interval = confidenceInterval95OfMean([1, 2, 3, 4]);
    expect(interval?.low).toBeCloseTo(1.23485, 5);
    expect(interval?.high).toBeCloseTo(3.76515, 5);
  });

  it('does not exist for fewer than two samples', () => {
    expect(confidenceInterval95OfMean([0.5])).toBeNull();
  });
});

describe('summarizeMatch', () => {
  it('counts wins, draws and losses, and averages them into a score rate', () => {
    const stats = summarizeMatch([
      [win, loss],
      [draw, forfeitByA],
      [forfeitByB, win],
    ]);
    expect(stats).toMatchObject({ wins: 3, draws: 1, losses: 2 });
    expect(stats.scoreRate).toBeCloseTo(3.5 / 6, 10);
  });

  it('builds the interval from pairs: when every pair splits 1–1 there is no uncertainty', () => {
    const everyPairSplits = Array.from({ length: 50 }, () => [win, loss] as const);
    expect(summarizeMatch(everyPairSplits).scoreRateInterval).toEqual({ low: 0.5, high: 0.5 });

    const sameGamesTreatedAsIndependent = confidenceInterval95OfMean(
      everyPairSplits.flat().map(scoreForA),
    );
    if (!sameGamesTreatedAsIndependent) throw new Error('expected an interval');
    const width = sameGamesTreatedAsIndependent.high - sameGamesTreatedAsIndependent.low;
    expect(width).toBeGreaterThan(0.19);
  });
});

describe('eloGapFromScoreRate', () => {
  it('is 0 at 50% and 400 points when scoring 10 games in 11', () => {
    expect(eloGapFromScoreRate(0.5)).toBe(0);
    expect(eloGapFromScoreRate(10 / 11)).toBeCloseTo(400, 6);
  });

  it('stays finite for a perfect or a winless record', () => {
    expect(Number.isFinite(eloGapFromScoreRate(1))).toBe(true);
    expect(Number.isFinite(eloGapFromScoreRate(0))).toBe(true);
  });
});
