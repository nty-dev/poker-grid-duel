import { useCallback, useEffect, useState } from 'react';
import type { BotPlayer, ForfeitReason } from '../bots/types';
import { newGame, step } from '../engine/gameState/advanceGame';
import { isGameOver } from '../engine/gameState/readGameState';
import { scoreBoard } from '../engine/scoring';
import type { BoardScore, GameConfig, GameError, Position, Seat } from '../engine/types';
import { toBotView } from '../engine/botView';

const BOT_THINKING_DISPLAY_MS = 400;

type Participant =
  | { readonly kind: 'human'; readonly name: string }
  | { readonly kind: 'bot'; readonly name: string; readonly player: BotPlayer };

export type Seats = Readonly<Record<Seat, Participant>>;

export function assignSeats(seat: Seat, participant: Participant, opponent: Participant): Seats {
  return seat === 'rows'
    ? { rows: participant, columns: opponent }
    : { rows: opponent, columns: participant };
}

export type GameEnd =
  | { readonly kind: 'finished'; readonly score: BoardScore }
  | {
      readonly kind: 'forfeit';
      readonly seat: Seat;
      readonly reason: ForfeitReason;
      readonly detail: string;
    };

export function useGame(config: GameConfig, seats: Seats) {
  const [state, setState] = useState(() => newGame(config));
  const [end, setEnd] = useState<GameEnd | null>(null);

  const placeCurrentCard = useCallback(
    (position: Position): GameError | null => {
      const stepped = step(state, { seat: state.toMove, position });
      if (!stepped.ok) return stepped.error;
      setState(stepped.state);
      if (isGameOver(stepped.state)) {
        setEnd({ kind: 'finished', score: scoreBoard(stepped.state.board) });
      }
      return null;
    },
    [state],
  );

  const participantToMove = seats[state.toMove];
  const isInProgress = !end && !isGameOver(state);
  const isHumanTurn = isInProgress && participantToMove.kind === 'human';

  useEffect(() => {
    if (!isInProgress || participantToMove.kind !== 'bot') return;
    const seat = state.toMove;
    const view = toBotView(state, seat);
    const moveTimer = setTimeout(() => {
      const decision = participantToMove.player.chooseMove(view);
      if (!decision.ok) {
        setEnd({ kind: 'forfeit', seat, reason: decision.reason, detail: decision.detail });
        return;
      }
      const engineError = placeCurrentCard(decision.position);
      if (engineError) {
        setEnd({ kind: 'forfeit', seat, reason: 'invalid_move', detail: engineError });
      }
    }, BOT_THINKING_DISPLAY_MS);
    return () => clearTimeout(moveTimer);
  }, [state, isInProgress, participantToMove, placeCurrentCard]);

  const placeAsHuman = (position: Position) => {
    if (isHumanTurn) placeCurrentCard(position);
  };

  return { state, end, placeAsHuman, isHumanTurn };
}
