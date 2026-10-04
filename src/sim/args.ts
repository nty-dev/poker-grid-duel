interface TournamentArgs {
  games: number;
  seed: number;
}

type ParsedArgs = { ok: true; value: TournamentArgs } | { ok: false; error: string };

const KNOWN_FLAGS = ['games', 'seed'];
const FLAG_PATTERN = /^--([a-z]+)=(.*)$/;

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flagValues = new Map<string, string>();
  for (const argument of argv) {
    const match = FLAG_PATTERN.exec(argument);
    const [, flag, value] = match ?? [];
    if (!flag || !value) return { ok: false, error: `Unrecognised argument "${argument}"` };
    flagValues.set(flag, value);
  }
  const unknownFlag = [...flagValues.keys()].find((flag) => !KNOWN_FLAGS.includes(flag));
  if (unknownFlag !== undefined) return { ok: false, error: `Unknown flag --${unknownFlag}` };

  const games = Number(flagValues.get('games') ?? 200);
  if (!Number.isInteger(games) || games < 2 || games % 2 !== 0) {
    return { ok: false, error: '--games must be an even integer ≥ 2 (games are played in pairs)' };
  }
  const seed = Number(flagValues.get('seed') ?? 1);
  if (!Number.isInteger(seed)) return { ok: false, error: '--seed must be an integer' };

  return { ok: true, value: { games, seed } };
}
