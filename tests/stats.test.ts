import { describe, expect, it } from 'vitest';
import type { GameRecord, GameResult } from '../src/evaluation/match';
import {
  eloGapFromScoreRate,
  normalApproximationInterval95,
  pairScores,
  sampleStandardDeviation,
  scoreForA,
  summarizeMatch,
} from '../src/evaluation/stats';

const gameWith = (result: GameResult): GameRecord => ({
  config: { seed: 1, firstMover: 'rows' },
  seatOfA: 'rows',
  positionsInPlayOrder: [],
  result,
});
const win = gameWith({ kind: 'finished', score: { A: 10, B: 4 } });
const loss = gameWith({ kind: 'finished', score: { A: 2, B: 7 } });
const draw = gameWith({ kind: 'finished', score: { A: 5, B: 5 } });
const forfeitByA = gameWith({ kind: 'forfeit', by: 'A', reason: 'invalid_move', detail: '' });
const forfeitByB = gameWith({ kind: 'forfeit', by: 'B', reason: 'exception', detail: '' });

describe('scoreForA', () => {
  it('is 1 for a win, ½ for a draw, 0 for a loss, and a forfeit loses', () => {
    expect([win, draw, loss, forfeitByA, forfeitByB].map(scoreForA)).toEqual([1, 0.5, 0, 0, 1]);
  });
});

describe('pairScores', () => {
  it('averages each consecutive pair of games', () => {
    expect(pairScores([win, loss, draw, win, win, win])).toEqual([0.5, 0.75, 1]);
  });
});

describe('the 95% interval', () => {
  it('matches a calculation done by hand', () => {
    // Samples 1, 2, 3, 4: mean 2.5, standard deviation √(5/3), standard error = that / √4.
    const standardDeviation = Math.sqrt(5 / 3);
    const halfWidth = (1.959964 * standardDeviation) / 2;
    expect(sampleStandardDeviation([1, 2, 3, 4])).toBeCloseTo(standardDeviation, 10);
    const interval = normalApproximationInterval95([1, 2, 3, 4]);
    expect(interval?.low).toBeCloseTo(2.5 - halfWidth, 10);
    expect(interval?.high).toBeCloseTo(2.5 + halfWidth, 10);
  });

  it('does not exist for fewer than two samples', () => {
    expect(normalApproximationInterval95([0.5])).toBeNull();
  });
});

describe('summarizeMatch', () => {
  it('counts wins, draws and losses, and averages the score difference of finished games', () => {
    const stats = summarizeMatch([win, loss, draw, forfeitByA, forfeitByB, win]);
    expect(stats).toMatchObject({ games: 6, wins: 3, draws: 1, losses: 2 });
    expect(stats.scoreRate).toBeCloseTo(3.5 / 6, 10);
    expect(stats.averageScoreDifference).toBeCloseTo((6 - 5 + 0 + 6) / 4, 10);
  });

  it('builds the interval from pairs: when every pair splits 1–1 there is no uncertainty', () => {
    const everyPairSplits = Array.from({ length: 50 }, () => [win, loss]).flat();
    expect(summarizeMatch(everyPairSplits).scoreRateInterval).toEqual({ low: 0.5, high: 0.5 });

    const sameGamesTreatedAsIndependent = normalApproximationInterval95(
      everyPairSplits.map(scoreForA),
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
