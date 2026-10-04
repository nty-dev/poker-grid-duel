// npm run playouts -- [--games=200] [--seed=1]
// Plays Monte Carlo against Greedy at several playout counts and prints one
// JSON line per count.
import { createBotPlayer } from '../bots/runner';
import { runMatch } from '../evaluation/match';
import { eloGapFromScoreRate, summarizeMatch } from '../evaluation/stats';
import { averageMsPerMove, newMoveTimer, withMoveTimer } from './moveTimer';
import { readPresetSource } from './presetSources';

const PLAYOUT_COUNTS = [5, 10, 25, 50, 100, 200, 400];
const PLAYOUTS_LINE_IN_SOURCE = 'const PLAYOUTS = 100;';

function monteCarloSourceWithPlayouts(playouts: number): string {
  const source = readPresetSource('montecarlo');
  if (!source.includes(PLAYOUTS_LINE_IN_SOURCE)) {
    throw new Error(`montecarlo.js no longer contains "${PLAYOUTS_LINE_IN_SOURCE}"`);
  }
  return source.replace(PLAYOUTS_LINE_IN_SOURCE, `const PLAYOUTS = ${playouts};`);
}

function integerFlag(name: string, fallback: number, minimum: number): number {
  const argument = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = argument ? Number(argument.split('=')[1]) : fallback;
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`--${name} must be an integer ≥ ${minimum}`);
  }
  return value;
}

const roundTo4 = (value: number) => +value.toFixed(4);

const games = integerFlag('games', 200, 2);
const baseSeed = integerFlag('seed', 1, 0);

for (const playouts of PLAYOUT_COUNTS) {
  const timer = newMoveTimer();
  const monteCarlo = withMoveTimer(createBotPlayer(monteCarloSourceWithPlayouts(playouts)), timer);
  const greedy = createBotPlayer(readPresetSource('greedy'));
  const stats = summarizeMatch(
    runMatch({ A: monteCarlo, B: greedy }, { pairs: Math.floor(games / 2), baseSeed }),
  );
  const interval = stats.scoreRateInterval;
  console.log(
    JSON.stringify({
      playouts,
      games: stats.games,
      scoreRate: roundTo4(stats.scoreRate),
      ci95: interval && [roundTo4(interval.low), roundTo4(interval.high)],
      eloOverGreedy: Math.round(eloGapFromScoreRate(stats.scoreRate)),
      msPerMove: +averageMsPerMove(timer).toFixed(2),
    }),
  );
}
