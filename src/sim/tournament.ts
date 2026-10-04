// npm run sim -- [--games=200] [--seed=1]
// Rates the preset bots and prints the result as JSON; progress goes to stderr.
import { createBotPlayer } from '../bots/runner';
import type { PresetBot } from '../bots/types';
import { runMatch } from '../evaluation/match';
import { eloGapFromScoreRate, summarizeMatch } from '../evaluation/stats';
import { parseArgs } from './args';
import { loadPresetBots } from './presetSources';

const RATING_OF_FIRST_BOT = 800;

const roundTo4 = (value: number) => +value.toFixed(4);

function playRatingMatch(bot: PresetBot, previousBot: PresetBot, games: number, seed: number) {
  console.error(`Playing ${bot.id} vs ${previousBot.id} (${games} games)...`);
  const players = { A: createBotPlayer(bot.source), B: createBotPlayer(previousBot.source) };
  const stats = summarizeMatch(runMatch(players, { pairs: games / 2, baseSeed: seed }));
  const interval = stats.scoreRateInterval;
  return {
    bot: bot.id,
    against: previousBot.id,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    scoreRate: roundTo4(stats.scoreRate),
    scoreRateCi95: interval && [roundTo4(interval.low), roundTo4(interval.high)],
    eloGap: Math.round(eloGapFromScoreRate(stats.scoreRate)),
  };
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`Error: ${parsed.error}`);
    process.exit(1);
  }
  const { games, seed } = parsed.value;

  // Each bot is rated from its match against the bot listed just before it,
  // so every rating rests on a match that is not too one-sided to measure.
  const matches: ReturnType<typeof playRatingMatch>[] = [];
  const calibratedRatings: Record<string, number> = {};
  let previous: { bot: PresetBot; rating: number } | null = null;
  for (const bot of loadPresetBots()) {
    let rating = RATING_OF_FIRST_BOT;
    if (previous) {
      const match = playRatingMatch(bot, previous.bot, games, seed);
      matches.push(match);
      rating = previous.rating + match.eloGap;
    }
    calibratedRatings[bot.id] = rating;
    previous = { bot, rating };
  }

  console.log(JSON.stringify({ config: { games, seed }, matches, calibratedRatings }, null, 2));
}

main();
