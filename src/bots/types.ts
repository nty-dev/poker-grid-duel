import type { BotView, Position, Rng } from '../engine/types';

export interface Bot {
  chooseMove(view: BotView): Position;
}

export type ForfeitReason = 'exception' | 'invalid_move';

export type BotDecision =
  | { readonly ok: true; readonly position: Position }
  | { readonly ok: false; readonly reason: ForfeitReason; readonly detail: string };

export const PRESET_IDS = ['random', 'greedy', 'montecarlo'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export interface PresetBot {
  readonly id: PresetId;
  readonly name: string;
  readonly description: string;
  readonly ratingFromTournament: number;
  createBot(rng: Rng): Bot;
}
