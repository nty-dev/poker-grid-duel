import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
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
            <Button
              variant="contained"
              onClick={() => setStartedGame(startGame(setup, startedGame.gameNumber + 1))}
            >
              Play again
            </Button>
            <Button variant="outlined" onClick={() => setStartedGame(null)}>
              Change setup
            </Button>
          </>
        }
      />
    );
  }

  return (
    <main className="home">
      <Paper component="section" variant="outlined" className="setup" sx={{ p: 2 }}>
        <h2>Human vs Human</h2>
        <Typography variant="body2" color="text.secondary">
          Player 1 scores
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          color="primary"
          value={setup.playerOneSeat}
          onChange={(_event, picked: Seat | null) => {
            if (picked !== null) setSetup({ ...setup, playerOneSeat: picked });
          }}
        >
          <ToggleButton value="rows">Rows</ToggleButton>
          <ToggleButton value="columns">Columns</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          First move
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          color="primary"
          value={setup.playerOneMovesFirst}
          onChange={(_event, picked: boolean | null) => {
            if (picked !== null) setSetup({ ...setup, playerOneMovesFirst: picked });
          }}
        >
          <ToggleButton value={true}>Player 1</ToggleButton>
          <ToggleButton value={false}>Player 2</ToggleButton>
        </ToggleButtonGroup>
        <div className="actions">
          <Button variant="contained" onClick={() => setStartedGame(startGame(setup, 1))}>
            Start
          </Button>
        </div>
      </Paper>
    </main>
  );
}
