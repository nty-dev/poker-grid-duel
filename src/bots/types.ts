import type { BotView, Position, Rng } from '../engine/types';

export interface Bot {
  chooseMove(view: BotView): Position;
}

export type ForfeitReason = 'exception' | 'invalid_move';

export type BotDecision =
  | { readonly ok: true; readonly position: Position }
  | { readonly ok: false; readonly reason: ForfeitReason; readonly detail: string };

export type BotId = 'random' | 'greedy' | 'montecarlo';

export interface BotCatalogEntry {
  readonly id: BotId;
  readonly name: string;
  readonly description: string;
  readonly ratingFromTournament: number;
  createBot(rng: Rng): Bot;
}
