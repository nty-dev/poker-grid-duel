import { createDeck, fisherYatesShuffle } from '../deck';
import { createRng } from '../rng';
import { BOARD_SIZE } from '../rules';
import type {
  Board,
  Card,
  GameConfig,
  GameError,
  GameState,
  Move,
  Position,
  StepResult,
} from '../types';
import { countPlacedCards, currentCard, isGameOver, isOnBoard, otherSeat } from './readGameState';

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

export function newGame({ seed, firstMover }: GameConfig): GameState {
  return {
    board: emptyBoard(),
    deck: fisherYatesShuffle(createDeck(), createRng(seed)),
    toMove: firstMover,
  };
}

export function withCardAt(board: Board, position: Position, card: Card): Board {
  return board.map((cellsInRow, row) =>
    row === position.row
      ? cellsInRow.map((cell, column) => (column === position.column ? card : cell))
      : cellsInRow,
  );
}

function findMoveError(state: GameState, { seat, position }: Move): GameError | null {
  if (isGameOver(state)) return 'gameOver';
  if (seat !== state.toMove) return 'notYourTurn';
  if (!isOnBoard(position)) return 'notOnBoard';
  if (state.board[position.row]?.[position.column] !== null) return 'cellOccupied';
  return null;
}

export function step(state: GameState, move: Move): StepResult {
  const error = findMoveError(state, move);
  if (error) return { ok: false, error };

  const card = currentCard(state);
  if (!card) {
    throw new Error(
      `The deck ran out with the board unfinished: ${countPlacedCards(state)} cards are placed ` +
        `and the deck holds ${state.deck.length}. A game needs ${BOARD_SIZE * BOARD_SIZE}.`,
    );
  }

  return {
    ok: true,
    state: {
      board: withCardAt(state.board, move.position, card),
      deck: state.deck,
      toMove: otherSeat(state.toMove),
    },
  };
}
