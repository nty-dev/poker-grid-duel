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
            <button
              onClick={() =>
                setStartedGame(startGame(setup, startedGame.opponent, startedGame.gameNumber + 1))
              }
            >
              Play again
            </button>
            <button className="secondary" onClick={() => setStartedGame(null)}>
              Change opponent
            </button>
          </>
        }
      />
    );
  }

  return (
    <main className="home">
      <section className="setup">
        <h2>Choose an opponent</h2>
        <fieldset>
          <legend>You score</legend>
          {(['rows', 'columns'] as const).map((seat) => (
            <label key={seat}>
              <input
                type="radio"
                name="humanSeat"
                checked={setup.humanSeat === seat}
                onChange={() => setSetup({ ...setup, humanSeat: seat })}
              />{' '}
              {seat}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>First move</legend>
          {[true, false].map((humanMovesFirst) => (
            <label key={String(humanMovesFirst)}>
              <input
                type="radio"
                name="firstMover"
                checked={setup.humanMovesFirst === humanMovesFirst}
                onChange={() => setSetup({ ...setup, humanMovesFirst })}
              />{' '}
              {humanMovesFirst ? 'You' : 'The bot'}
            </label>
          ))}
        </fieldset>
      </section>
      <OpponentPicker bots={PRESET_BOTS} picked={pickedBot} onPick={setPickedBot} />
      {pickedBot && (
        <BotDescription
          bot={pickedBot}
          onDuel={() => setStartedGame(startGame(setup, pickedBot, 1))}
        />
      )}
    </main>
  );
}
