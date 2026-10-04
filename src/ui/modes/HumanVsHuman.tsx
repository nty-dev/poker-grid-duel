import { useState } from 'react';
import { otherSeat } from '../../engine/gameState/readGameState';
import type { GameConfig, Seat } from '../../engine/types';
import { randomGameSeed } from '../browser';
import { GameView } from '../components/GameView';
import { assignSeats, type Seats } from '../useGame';

interface Setup {
  readonly playerOneSeat: Seat;
  readonly playerOneMovesFirst: boolean;
}

interface StartedGame {
  readonly gameNumber: number;
  readonly config: GameConfig;
  readonly seats: Seats;
}

function startGame({ playerOneSeat, playerOneMovesFirst }: Setup, gameNumber: number): StartedGame {
  const seats = assignSeats(
    playerOneSeat,
    { kind: 'human', name: 'Player 1' },
    { kind: 'human', name: 'Player 2' },
  );
  const firstMover = playerOneMovesFirst ? playerOneSeat : otherSeat(playerOneSeat);
  return { gameNumber, seats, config: { seed: randomGameSeed(), firstMover } };
}

export function HumanVsHuman() {
  const [setup, setSetup] = useState<Setup>({ playerOneSeat: 'rows', playerOneMovesFirst: true });
  const [startedGame, setStartedGame] = useState<StartedGame | null>(null);

  if (startedGame) {
    return (
      <GameView
        key={startedGame.gameNumber}
        config={startedGame.config}
        seats={startedGame.seats}
        endActions={
          <>
            <button onClick={() => setStartedGame(startGame(setup, startedGame.gameNumber + 1))}>
              Play again
            </button>
            <button className="secondary" onClick={() => setStartedGame(null)}>
              Change setup
            </button>
          </>
        }
      />
    );
  }

  return (
    <main className="home">
      <section className="panel setup">
        <h2>Human vs Human</h2>
        <fieldset>
          <legend>Player 1 scores</legend>
          {(['rows', 'columns'] as const).map((seat) => (
            <label key={seat}>
              <input
                type="radio"
                name="playerOneSeat"
                checked={setup.playerOneSeat === seat}
                onChange={() => setSetup({ ...setup, playerOneSeat: seat })}
              />{' '}
              {seat}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>First move</legend>
          {[true, false].map((playerOneMovesFirst) => (
            <label key={String(playerOneMovesFirst)}>
              <input
                type="radio"
                name="firstMover"
                checked={setup.playerOneMovesFirst === playerOneMovesFirst}
                onChange={() => setSetup({ ...setup, playerOneMovesFirst })}
              />{' '}
              {playerOneMovesFirst ? 'Player 1' : 'Player 2'}
            </label>
          ))}
        </fieldset>
        <div className="actions">
          <button onClick={() => setStartedGame(startGame(setup, 1))}>Start</button>
        </div>
      </section>
    </main>
  );
}
