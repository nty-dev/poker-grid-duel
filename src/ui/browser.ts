export function randomGameSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
