// npm run sim -- --games=200 --seed=1 [--bots=random,greedy,montecarlo]
// Plays every pair of bots and prints a JSON report; progress goes to stderr.
import { createBotPlayer } from '../bots/runner';
import { runMatch, type GameRecord } from '../evaluation/match';
import {
  eloGapFromScoreRate,
  pairScores,
  sampleStandardDeviation,
  scoreForA,
  summarizeMatch,
} from '../evaluation/stats';
import { parseArgs } from './args';
import { averageMsPerMove, newMoveTimer, withMoveTimer, type MoveTimer } from './moveTimer';
import { loadPresetBots } from './presetSources';

const RATING_OF_FIRST_BOT = 800;

interface MatchReport {
  readonly botA: string;
  readonly botB: string;
  readonly games: readonly GameRecord[];
}

// Rates each bot from its match against the bot listed just before it, so
// every rating rests on a match that is not too one-sided to measure.
function ratingsChainedFromFirstBot(
  bots: readonly string[],
  matches: readonly MatchReport[],
): Record<string, number> {
  const ratings: Record<string, number> = {};
  bots.forEach((bot, index) => {
    const previousBot = bots[index - 1];
    if (previousBot === undefined) {
      ratings[bot] = RATING_OF_FIRST_BOT;
      return;
    }
    const match = matches.find((m) => m.botA === previousBot && m.botB === bot);
    const previousRating = ratings[previousBot];
    if (!match || previousRating === undefined) return;
    const scoreRateOfBot = 1 - summarizeMatch(match.games).scoreRate;
    ratings[bot] = Math.round(previousRating + eloGapFromScoreRate(scoreRateOfBot));
  });
  return ratings;
}

// In every pair each bot moves first once, on the same deal. Averaged over
// all games, skill cancels out and what remains is the effect of moving first.
function firstMoverScoreRate(matches: readonly MatchReport[]) {
  const scoresOfFirstMover = matches.flatMap(({ games }) =>
    games.map((game) => {
      const aMovedFirst = game.config.firstMover === game.seatOfA;
      return aMovedFirst ? scoreForA(game) : 1 - scoreForA(game);
    }),
  );
  const total = scoresOfFirstMover.reduce((sum, score) => sum + score, 0);
  const games = scoresOfFirstMover.length;
  return { games, score: games === 0 ? 0 : roundTo4(total / games) };
}

const roundTo4 = (value: number) => +value.toFixed(4);
const roundTo4OrNull = (value: number | null) => (value === null ? null : roundTo4(value));

function reportOf({ botA, botB, games }: MatchReport) {
  const stats = summarizeMatch(games);
  const interval = stats.scoreRateInterval;
  return {
    a: botA,
    b: botB,
    aWins: stats.wins,
    draws: stats.draws,
    bWins: stats.losses,
    aScoreRate: roundTo4(stats.scoreRate),
    aScoreRateCi95: interval && [roundTo4(interval.low), roundTo4(interval.high)],
    aAvgScoreDiff: roundTo4OrNull(stats.averageScoreDifference),
    pairScoreSd: roundTo4OrNull(sampleStandardDeviation(pairScores(games))),
  };
}

function main(): void {
  const presets = loadPresetBots();
  const parsed = parseArgs(
    process.argv.slice(2),
    presets.map((preset) => preset.id),
  );
  if (!parsed.ok) {
    console.error(`Error: ${parsed.error}`);
    process.exit(1);
  }
  const { games, seed, bots } = parsed.value;

  const timers: Record<string, MoveTimer> = Object.fromEntries(
    bots.map((bot) => [bot, newMoveTimer()]),
  );
  const timedPlayer = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const timer = timers[id];
    if (!preset || !timer) {
      throw new Error(`No preset bot is called "${id}". parseArgs should have rejected it.`);
    }
    return withMoveTimer(createBotPlayer(preset.source), timer);
  };

  const matches: MatchReport[] = [];
  for (const [index, botA] of bots.entries()) {
    for (const botB of bots.slice(index + 1)) {
      console.error(`Playing ${botA} vs ${botB} (${games} games)...`);
      const players = { A: timedPlayer(botA), B: timedPlayer(botB) };
      matches.push({ botA, botB, games: runMatch(players, { pairs: games / 2, baseSeed: seed }) });
    }
  }

  const report = {
    config: { games, seed, bots },
    pairs: matches.map(reportOf),
    firstMover: firstMoverScoreRate(matches),
    msPerMove: Object.fromEntries(
      Object.entries(timers).map(([bot, timer]) => [bot, +averageMsPerMove(timer).toFixed(2)]),
    ),
    calibratedRatings: ratingsChainedFromFirstBot(bots, matches),
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
