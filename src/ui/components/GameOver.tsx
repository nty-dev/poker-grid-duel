import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';
import type { ForfeitReason } from '../../bots/types';
import { otherSeat } from '../../engine/gameState/readGameState';
import { outcome } from '../../engine/scoring';
import type { BoardScore, LineScore, Seat } from '../../engine/types';
import type { GameEnd, Seats } from '../useGame';
import { HAND_NAME } from './handNames';

interface GameOverProps {
  end: GameEnd;
  score: BoardScore;
  seats: Seats;
  children: ReactNode;
}

const FORFEIT_DESCRIPTION: Record<ForfeitReason, string> = {
  exception: 'threw an error',
  invalid_move: 'made an invalid move',
};

function LineScores({
  seat,
  ownerName,
  lines,
}: {
  seat: Seat;
  ownerName: string;
  lines: readonly LineScore[];
}) {
  return (
    <div className={`line-list ${seat}`}>
      <h3>{ownerName === 'You' ? `Your ${seat}` : `${ownerName}'s ${seat}`}</h3>
      {lines.map((line, lineNumber) => (
        <div key={lineNumber} className="line-row">
          <span>
            {seat === 'rows' ? 'Row' : 'Col'} {lineNumber + 1}
          </span>
          <span>{HAND_NAME[line.hand]}</span>
          <b>{line.points}</b>
        </div>
      ))}
    </div>
  );
}

function winningSeat(end: GameEnd): Seat | null {
  if (end.kind === 'forfeit') return otherSeat(end.seat);
  const result = outcome(end.score.total);
  return result.kind === 'draw' ? null : result.winner;
}

function headlineFor(winnerName: string | null): string {
  if (winnerName === null) return 'Draw';
  return winnerName === 'You' ? 'You win!' : `${winnerName} wins!`;
}

export function GameOver({ end, score, seats, children }: GameOverProps) {
  const winner = winningSeat(end);
  return (
    <Paper variant="outlined" className="game-over" sx={{ p: 2 }}>
      <h2>{headlineFor(winner && seats[winner].name)}</h2>
      {end.kind === 'forfeit' && (
        <p className="error-text">
          {seats[end.seat].name} {FORFEIT_DESCRIPTION[end.reason]} and forfeits ({end.detail}).
        </p>
      )}
      <p className="final-score">
        {score.total.rows} – {score.total.columns}
      </p>
      <div className="summary">
        <LineScores seat="rows" ownerName={seats.rows.name} lines={score.rows} />
        <LineScores seat="columns" ownerName={seats.columns.name} lines={score.columns} />
      </div>
      <div className="actions">{children}</div>
    </Paper>
  );
}
