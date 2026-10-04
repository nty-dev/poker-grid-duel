import seedrandom from 'seedrandom';
import type { Rng, Seed } from './types';

export function createRng(seed: Seed): Rng {
  const nextFloat = seedrandom(String(seed));
  return { nextFloat, nextIntBelow: (limit) => Math.floor(nextFloat() * limit) };
}
