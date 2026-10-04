// npm run bench: times one Monte Carlo move at the opening and mid-game.
import { createBotPlayer } from '../bots/runner';
import { emptyPositions, newGame, step } from '../engine/game';
import type { GameState } from '../engine/types';
import { toBotView } from '../engine/botView';
import { readPresetSource } from './presetSources';

const TIMED_RUNS = 5;
const CARDS_PLACED_MID_GAME = 12;

function stateAfterPlacing(start: GameState, cardCount: number): GameState {
  const scatteredPositions = emptyPositions(start.board)
    .filter((_, n) => n % 2 === 0)
    .slice(0, cardCount);
  let state = start;
  for (const position of scatteredPositions) {
    const stepped = step(state, { seat: state.toMove, position });
    if (stepped.ok) state = stepped.state;
  }
  return state;
}

function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

const opening = newGame({ seed: 1, firstMover: 'rows' });
const positions = {
  opening,
  [`mid-game (${CARDS_PLACED_MID_GAME} placed)`]: stateAfterPlacing(opening, CARDS_PLACED_MID_GAME),
};
const monteCarlo = createBotPlayer(readPresetSource('montecarlo'));

for (const [label, state] of Object.entries(positions)) {
  const view = toBotView(state, state.toMove);
  const durationsMs: number[] = [];
  for (let run = 0; run < TIMED_RUNS; run++) {
    const startedAt = performance.now();
    monteCarlo.chooseMove(view, run);
    durationsMs.push(performance.now() - startedAt);
  }
  console.log(
    `montecarlo ${label}: median ${medianOf(durationsMs).toFixed(0)} ms (${TIMED_RUNS} runs)`,
  );
}
