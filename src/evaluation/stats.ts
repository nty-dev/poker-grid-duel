import type { GameRecord } from './match';

const Z_FOR_95_PERCENT = 1.959964;

interface Interval {
  readonly low: number;
  readonly high: number;
}

interface MatchStats {
  readonly games: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly scoreRate: number;
  readonly scoreRateInterval: Interval | null;
  readonly averageScoreDifference: number | null;
}

const WIN = 1;
const DRAW = 0.5;
const LOSS = 0;

export function scoreForA(game: GameRecord): number {
  const { result } = game;
  if (result.kind === 'forfeit') return result.by === 'A' ? LOSS : WIN;
  if (result.score.A === result.score.B) return DRAW;
  return result.score.A > result.score.B ? WIN : LOSS;
}

// The two games of a pair share a deal, so they are not independent. Each
// pair is treated as one sample: the average of its two scores.
export function pairScores(games: readonly GameRecord[]): number[] {
  const scores: number[] = [];
  for (let first = 0; first + 1 < games.length; first += 2) {
    const [gameOne, gameTwo] = [games[first], games[first + 1]];
    if (gameOne && gameTwo) scores.push((scoreForA(gameOne) + scoreForA(gameTwo)) / 2);
  }
  return scores;
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

export function normalApproximationInterval95(samples: readonly number[]): Interval | null {
  const standardDeviation = sampleStandardDeviation(samples);
  if (standardDeviation === null) return null;
  const standardError = standardDeviation / Math.sqrt(samples.length);
  const halfWidth = Z_FOR_95_PERCENT * standardError;
  const average = mean(samples);
  return { low: average - halfWidth, high: average + halfWidth };
}

function clampToZeroOne(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function summarizeMatch(games: readonly GameRecord[]): MatchStats {
  const scores = games.map(scoreForA);
  const interval = normalApproximationInterval95(pairScores(games));
  const scoreDifferences = games.flatMap(({ result }) =>
    result.kind === 'finished' ? [result.score.A - result.score.B] : [],
  );
  return {
    games: games.length,
    wins: scores.filter((score) => score === WIN).length,
    draws: scores.filter((score) => score === DRAW).length,
    losses: scores.filter((score) => score === LOSS).length,
    scoreRate: scores.length ? mean(scores) : 0,
    scoreRateInterval: interval && {
      low: clampToZeroOne(interval.low),
      high: clampToZeroOne(interval.high),
    },
    averageScoreDifference: scoreDifferences.length ? mean(scoreDifferences) : null,
  };
}

const ELO_RATING_SCALE = 400;

// A 0% or 100% score rate would mean an infinite rating gap.
const LOWEST_USABLE_SCORE_RATE = 0.01;
const HIGHEST_USABLE_SCORE_RATE = 0.99;

export function eloGapFromScoreRate(scoreRate: number): number {
  const usable = Math.min(HIGHEST_USABLE_SCORE_RATE, Math.max(LOWEST_USABLE_SCORE_RATE, scoreRate));
  return ELO_RATING_SCALE * Math.log10(usable / (1 - usable));
}
