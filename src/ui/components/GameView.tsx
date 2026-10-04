import { useState, type ReactNode } from 'react';
import { scoreBoard } from '../../engine/scoring';
import type { GameConfig, Position } from '../../engine/types';
import { useGame, type Seats } from '../useGame';
import { Board } from './Board';
import { GameOver } from './GameOver';
import { Sidebar } from './Sidebar';

interface GameViewProps {
  config: GameConfig;
  seats: Seats;
  endActions: ReactNode;
}

export function GameView({ config, seats, endActions }: GameViewProps) {
  const { state, end, placeAsHuman, isHumanTurn } = useGame(config, seats);
  const [hovered, setHovered] = useState<Position | null>(null);
  const score = scoreBoard(state.board);
  const isHoveredCellEmpty =
    hovered !== null && state.board[hovered.row]?.[hovered.column] === null;
  const hoveredOnHumanTurn = isHumanTurn && isHoveredCellEmpty ? hovered : null;

  return (
    <div className="game">
      <div>
        <div className="axis-hint">
          <span className="rows-text">Rows → {seats.rows.name}</span> ·{' '}
          <span className="columns-text">Columns ↓ {seats.columns.name}</span>
        </div>
        <Board
          board={state.board}
          score={score}
          hovered={hoveredOnHumanTurn}
          acceptsClicks={isHumanTurn}
          onCellClick={(position) => {
            placeAsHuman(position);
            setHovered(null);
          }}
          onHover={setHovered}
        />
      </div>
      {end ? (
        <GameOver end={end} score={score} seats={seats}>
          {endActions}
        </GameOver>
      ) : (
        <Sidebar state={state} score={score} seats={seats} hovered={hoveredOnHumanTurn} />
      )}
    </div>
  );
}
