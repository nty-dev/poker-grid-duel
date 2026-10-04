interface TournamentArgs {
  games: number;
  seed: number;
  bots: string[];
}

type ParsedArgs = { ok: true; value: TournamentArgs } | { ok: false; error: string };

const KNOWN_FLAGS = ['games', 'seed', 'bots'];
const FLAG_PATTERN = /^--([a-z]+)=(.*)$/;

export function parseArgs(argv: readonly string[], knownBots: readonly string[]): ParsedArgs {
  const flagValues = new Map<string, string>();
  for (const argument of argv) {
    const match = FLAG_PATTERN.exec(argument);
    if (!match) return { ok: false, error: `Unrecognised argument "${argument}"` };
    flagValues.set(match[1] ?? '', match[2] ?? '');
  }
  const unknownFlag = [...flagValues.keys()].find((flag) => !KNOWN_FLAGS.includes(flag));
  if (unknownFlag !== undefined) return { ok: false, error: `Unknown flag --${unknownFlag}` };

  const games = Number(flagValues.get('games') ?? 200);
  if (!Number.isInteger(games) || games < 2 || games % 2 !== 0) {
    return { ok: false, error: '--games must be an even integer ≥ 2 (games are played in pairs)' };
  }
  const seed = Number(flagValues.get('seed') ?? 1);
  if (!Number.isInteger(seed)) return { ok: false, error: '--seed must be an integer' };

  const bots = flagValues.get('bots')?.split(',') ?? [...knownBots];
  const unknownBot = bots.find((bot) => !knownBots.includes(bot));
  if (unknownBot !== undefined) {
    return { ok: false, error: `Unknown bot "${unknownBot}". Known: ${knownBots.join(', ')}` };
  }
  if (bots.length < 2) return { ok: false, error: '--bots needs at least two bots' };

  return { ok: true, value: { games, seed, bots } };
}
