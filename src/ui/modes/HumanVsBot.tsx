import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { PRESET_BOTS } from '../../bots/presets/catalog';
import type { PresetBot } from '../../bots/types';
import { otherSeat } from '../../engine/gameState/readGameState';
import { createRng } from '../../engine/rng';
import type { GameConfig, Seat } from '../../engine/types';
import { randomGameSeed } from '../browser';
import { BotDescription } from '../components/BotDescription';
import { GameView } from '../components/GameView';
import { OpponentPicker } from '../components/OpponentPicker';
import { assignSeats, type Seats } from '../useGame';

interface Setup {
  readonly humanSeat: Seat;
  readonly humanMovesFirst: boolean;
}

interface StartedGame {
  readonly gameNumber: number;
  readonly opponent: PresetBot;
  readonly config: GameConfig;
  readonly seats: Seats;
}

function startGame(
  { humanSeat, humanMovesFirst }: Setup,
  opponent: PresetBot,
  gameNumber: number,
): StartedGame {
  const seats = assignSeats(
    humanSeat,
    { kind: 'human', name: 'You' },
    {
      kind: 'bot',
      name: opponent.name,
      bot: opponent.createBot(createRng(randomGameSeed())),
    },
  );
  const firstMover = humanMovesFirst ? humanSeat : otherSeat(humanSeat);
  return { gameNumber, opponent, seats, config: { seed: randomGameSeed(), firstMover } };
}

export function HumanVsBot() {
  const [setup, setSetup] = useState<Setup>({ humanSeat: 'rows', humanMovesFirst: true });
  const [areSettingsOpen, setAreSettingsOpen] = useState(false);
  const [pickedBot, setPickedBot] = useState<PresetBot | null>(null);
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
              onClick={() =>
                setStartedGame(startGame(setup, startedGame.opponent, startedGame.gameNumber + 1))
              }
            >
              Play again
            </Button>
            <Button variant="outlined" onClick={() => setStartedGame(null)}>
              Change opponent
            </Button>
          </>
        }
      />
    );
  }

  return (
    <main className="home">
      <section>
        <h2>Choose an opponent</h2>
        <OpponentPicker bots={PRESET_BOTS} picked={pickedBot} onPick={setPickedBot} />
      </section>
      <section className="setup">
        <div className="settings-summary">
          <span>
            You score the <b>{setup.humanSeat}</b> and move{' '}
            <b>{setup.humanMovesFirst ? 'first' : 'second'}</b>.
          </span>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAreSettingsOpen(!areSettingsOpen)}
          >
            {areSettingsOpen ? 'Hide settings' : 'Change settings'}
          </Button>
        </div>
        {areSettingsOpen && (
          <>
            <Typography variant="body2" color="text.secondary">
              You score
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              value={setup.humanSeat}
              onChange={(_event, picked: Seat | null) => {
                if (picked !== null) setSetup({ ...setup, humanSeat: picked });
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
              value={setup.humanMovesFirst}
              onChange={(_event, picked: boolean | null) => {
                if (picked !== null) setSetup({ ...setup, humanMovesFirst: picked });
              }}
            >
              <ToggleButton value={true}>You</ToggleButton>
              <ToggleButton value={false}>The bot</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}
      </section>
      {pickedBot && (
        <BotDescription
          bot={pickedBot}
          onDuel={() => setStartedGame(startGame(setup, pickedBot, 1))}
        />
      )}
    </main>
  );
}
