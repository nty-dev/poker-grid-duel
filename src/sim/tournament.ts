import { PRESET_BOTS } from '../bots/presets/catalog';
import type { PresetBot } from '../bots/types';
import { createRng } from '../engine/rng';
import { runMatch } from '../evaluation/match';
import { eloGapFromScoreRate, summarizeMatch } from '../evaluation/stats';
import { parseArgs } from './args';

const USAGE = 'npm run sim -- [--games=200] [--seed=1]';
const ANCHOR_RATING_OF_WEAKEST_BOT = 800;

const roundTo4Decimals = (value: number) => +value.toFixed(4);

function playRatingMatch(bot: PresetBot, opponent: PresetBot, games: number, seed: number) {
  console.error(`Playing ${bot.id} vs ${opponent.id} (${games} games)...`);
  const players = {
    A: bot.createBot(createRng(`${seed}/${bot.id}`)),
    B: opponent.createBot(createRng(`${seed}/${opponent.id}`)),
  };
  const stats = summarizeMatch(runMatch(players, { pairCount: games / 2, baseSeed: seed }));
  const interval = stats.scoreRateInterval;
  return {
    bot: bot.id,
    against: opponent.id,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    scoreRate: roundTo4Decimals(stats.scoreRate),
    scoreRateCi95: interval && [roundTo4Decimals(interval.low), roundTo4Decimals(interval.high)],
    eloGap: Math.round(eloGapFromScoreRate(stats.scoreRate)),
  };
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`Error: ${parsed.error}\nUsage: ${USAGE}`);
    process.exit(1);
  }
  const { games, seed } = parsed.value;

  const matches: ReturnType<typeof playRatingMatch>[] = [];
  const calibratedRatings: Record<string, number> = {};
  let previousRated: { bot: PresetBot; rating: number } | null = null;
  for (const bot of PRESET_BOTS) {
    let rating = ANCHOR_RATING_OF_WEAKEST_BOT;
    if (previousRated) {
      const match = playRatingMatch(bot, previousRated.bot, games, seed);
      matches.push(match);
      rating = previousRated.rating + match.eloGap;
    }
    calibratedRatings[bot.id] = rating;
    previousRated = { bot, rating };
  }

  console.log(JSON.stringify({ config: { games, seed }, matches, calibratedRatings }, null, 2));
}

main();
