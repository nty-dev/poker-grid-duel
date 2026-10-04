import type { BoardScore, LineScore, Board as BoardCells, Position } from '../../engine/types';
import { BOARD_SIZE } from '../../engine/rules';
import { CardView } from './CardView';
import { HAND_NAME } from './handNames';

const HAND_LABEL_TRACK = BOARD_SIZE + 1;

interface BoardProps {
  board: BoardCells;
  score: BoardScore;
  hovered: Position | null;
  acceptsClicks: boolean;
  onCellClick(position: Position): void;
  onHover(position: Position | null): void;
}

interface LineLabelProps {
  line: LineScore;
  kind: 'row' | 'col';
  lineNumber: number;
}

function LineLabel({ line, kind, lineNumber }: LineLabelProps) {
  const gridPosition =
    kind === 'row'
      ? { gridRow: lineNumber + 1, gridColumn: HAND_LABEL_TRACK }
      : { gridRow: HAND_LABEL_TRACK, gridColumn: lineNumber + 1 };
  return (
    <div
      className={`line-label ${kind}-label ${line.isComplete ? '' : 'partial'}`}
      style={gridPosition}
    >
      <span className="hand">{HAND_NAME[line.hand]}</span>
      <span className="pts">{line.points}</span>
    </div>
  );
}

export function Board({ board, score, hovered, acceptsClicks, onCellClick, onHover }: BoardProps) {
  return (
    <div className="board">
      {board.flatMap((cellsInRow, row) =>
        cellsInRow.map((card, column) => {
          const isEmpty = card === null;
          const classNames = [
            'cell',
            isEmpty && acceptsClicks ? 'cell-open' : '',
            row === hovered?.row ? 'in-hover-row' : '',
            column === hovered?.column ? 'in-hover-col' : '',
          ];
          return (
            <button
              key={`${row}-${column}`}
              className={classNames.join(' ')}
              style={{ gridRow: row + 1, gridColumn: column + 1 }}
              disabled={!isEmpty || !acceptsClicks}
              onClick={() => onCellClick({ row, column })}
              onMouseEnter={() => onHover(isEmpty ? { row, column } : null)}
              onMouseLeave={() => onHover(null)}
              aria-label={`row ${row + 1} column ${column + 1}`}
            >
              {card && <CardView card={card} />}
            </button>
          );
        }),
      )}
      {score.rows.map((line, row) => (
        <LineLabel key={`row-${row}`} line={line} kind="row" lineNumber={row} />
      ))}
      {score.columns.map((line, column) => (
        <LineLabel key={`col-${column}`} line={line} kind="col" lineNumber={column} />
      ))}
    </div>
  );
}
