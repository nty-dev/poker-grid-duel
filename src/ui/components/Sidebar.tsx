import { withCardAt } from '../../engine/gameState/advanceGame';
import Paper from '@mui/material/Paper';
import { currentCard, nextCard } from '../../engine/gameState/readGameState';
import { lineCells, scoreLine } from '../../engine/scoring';
import type { BoardScore, Board, GameState, Position, Seat } from '../../engine/types';
import type { Seats } from '../useGame';
import { CardView } from './CardView';
import { HAND_NAME } from './handNames';

interface SidebarProps {
  state: GameState;
  score: BoardScore;
  seats: Seats;
  hovered: Position | null;
}

interface PreviewLineProps {
  label: string;
  boardBefore: Board;
  boardAfter: Board;
  seat: Seat;
  lineNumber: number;
}

function PreviewLine({ label, boardBefore, boardAfter, seat, lineNumber }: PreviewLineProps) {
  const before = scoreLine(lineCells(boardBefore, seat, lineNumber));
  const after = scoreLine(lineCells(boardAfter, seat, lineNumber));
  const pointsGained = after.points - before.points;
  const changeClass = pointsGained > 0 ? 'up' : pointsGained < 0 ? 'down' : '';
  return (
    <div className="preview-line">
      <span>{label}</span>
      <span>
        {HAND_NAME[before.hand]} → {HAND_NAME[after.hand]}{' '}
        <b className={changeClass}>
          {pointsGained >= 0 ? '+' : ''}
          {pointsGained}
        </b>
      </span>
    </div>
  );
}

interface PlacementPreviewProps {
  state: GameState;
  seats: Seats;
  position: Position;
}

function PlacementPreview({ state, seats, position }: PlacementPreviewProps) {
  const card = currentCard(state);
  if (!card) return null;
  const boardAfter = withCardAt(state.board, position, card);
  const { row, column } = position;
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <h3>If placed here</h3>
      <PreviewLine
        label={`Row ${row + 1} (${seats.rows.name})`}
        boardBefore={state.board}
        boardAfter={boardAfter}
        seat="rows"
        lineNumber={row}
      />
      <PreviewLine
        label={`Column ${column + 1} (${seats.columns.name})`}
        boardBefore={state.board}
        boardAfter={boardAfter}
        seat="columns"
        lineNumber={column}
      />
    </Paper>
  );
}

export function Sidebar({ state, score, seats, hovered }: SidebarProps) {
  const seatToMove = state.toMove;
  const participantToMove = seats[seatToMove];
  const colorOfSeatToMove = seatToMove === 'rows' ? 'primary.main' : 'secondary.main';
  const turnText =
    participantToMove.kind === 'bot'
      ? `${participantToMove.name} is thinking…`
      : `${participantToMove.name} to move (${seatToMove})`;

  return (
    <aside className="sidebar">
      <Paper variant="outlined" className="scores" sx={{ p: 1.5 }}>
        <div className="score rows">
          <span>{seats.rows.name} · rows</span>
          <strong>{score.total.rows}</strong>
        </div>
        <div className="score columns">
          <span>{seats.columns.name} · columns</span>
          <strong>{score.total.columns}</strong>
        </div>
      </Paper>

      <Paper
        variant="outlined"
        aria-live="polite"
        sx={{ p: 1.5, fontWeight: 600, color: colorOfSeatToMove, borderColor: colorOfSeatToMove }}
      >
        {turnText}
      </Paper>

      <Paper variant="outlined" className="cards" sx={{ p: 1.5 }}>
        <div>
          <h3>Current</h3>
          <CardView card={currentCard(state)} size="large" />
        </div>
        <div>
          <h3>Next</h3>
          <CardView card={nextCard(state)} size="large" />
        </div>
      </Paper>

      {hovered && <PlacementPreview state={state} seats={seats} position={hovered} />}
    </aside>
  );
}
