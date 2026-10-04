import type { GamePair, GameRecord } from './match';

const Z_FOR_95_PERCENT_CONFIDENCE = 1.959964;

interface Interval {
  readonly low: number;
  readonly high: number;
}

interface MatchStats {
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly scoreRate: number;
  readonly scoreRateInterval: Interval | null;
}

const WIN = 1;
const DRAW = 0.5;
const LOSS = 0;

export function scoreForA(game: GameRecord): number {
  const { result } = game;
  if (result.kind === 'forfeit') return result.by === 'A' ? LOSS : WIN;
  if (result.points.A === result.points.B) return DRAW;
  return result.points.A > result.points.B ? WIN : LOSS;
}

export function pairScoresForA(pairs: readonly GamePair[]): number[] {
  return pairs.map(([gameOne, gameTwo]) => (scoreForA(gameOne) + scoreForA(gameTwo)) / 2);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sampleStandardDeviation(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values);
  const sumOfSquaredDeviations = values.reduce((sum, value) => sum + (value - average) ** 2, 0);
  const degreesOfFreedom = values.length - 1;
  return Math.sqrt(sumOfSquaredDeviations / degreesOfFreedom);
}

export function confidenceInterval95OfMean(samples: readonly number[]): Interval | null {
  const standardDeviation = sampleStandardDeviation(samples);
  if (standardDeviation === null) return null;
  const standardError = standardDeviation / Math.sqrt(samples.length);
  const halfWidth = Z_FOR_95_PERCENT_CONFIDENCE * standardError;
  const average = mean(samples);
  return { low: average - halfWidth, high: average + halfWidth };
}

function clampToZeroOne(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function summarizeMatch(pairs: readonly GamePair[]): MatchStats {
  const scores = pairs.flat().map(scoreForA);
  const interval = confidenceInterval95OfMean(pairScoresForA(pairs));
  return {
    wins: scores.filter((score) => score === WIN).length,
    draws: scores.filter((score) => score === DRAW).length,
    losses: scores.filter((score) => score === LOSS).length,
    scoreRate: scores.length ? mean(scores) : 0,
    scoreRateInterval: interval && {
      low: clampToZeroOne(interval.low),
      high: clampToZeroOne(interval.high),
    },
  };
}

const ELO_RATING_SCALE = 400;

const MIN_RATEABLE_SCORE_RATE = 0.01;
const MAX_RATEABLE_SCORE_RATE = 0.99;

export function eloGapFromScoreRate(scoreRate: number): number {
  const rateableScoreRate = Math.min(
    MAX_RATEABLE_SCORE_RATE,
    Math.max(MIN_RATEABLE_SCORE_RATE, scoreRate),
  );
  return ELO_RATING_SCALE * Math.log10(rateableScoreRate / (1 - rateableScoreRate));
}
