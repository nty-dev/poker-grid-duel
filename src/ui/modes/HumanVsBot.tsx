import { useState } from 'react';
import type { PresetBot } from '../../bots/types';
import { createBotPlayer } from '../../bots/runner';
import { otherSeat } from '../../engine/game';
import type { GameConfig, Seat } from '../../engine/types';
import { randomGameSeed } from '../browser';
import { GameView } from '../components/GameView';
import { OpponentPicker } from '../components/OpponentPicker';
import { PRESET_BOTS } from '../presetSources';
import { assignSeats, type Seats } from '../useGame';

interface Setup {
  readonly humanSeat: Seat;
  readonly humanMovesFirst: boolean;
}

interface Match {
  readonly id: number;
  readonly opponent: PresetBot;
  readonly config: GameConfig;
  readonly seats: Seats;
}

function newMatch({ humanSeat, humanMovesFirst }: Setup, opponent: PresetBot, id: number): Match {
  const seats = assignSeats(
    humanSeat,
    { kind: 'human', name: 'You' },
    { kind: 'bot', name: opponent.name, player: createBotPlayer(opponent.source) },
  );
  const firstMover = humanMovesFirst ? humanSeat : otherSeat(humanSeat);
  return { id, opponent, seats, config: { seed: randomGameSeed(), firstMover } };
}

export function HumanVsBot() {
  const [setup, setSetup] = useState<Setup>({ humanSeat: 'rows', humanMovesFirst: true });
  const [match, setMatch] = useState<Match | null>(null);

  if (match) {
    return (
      <GameView
        // A new key discards the old game's state, so each match starts clean.
        key={match.id}
        config={match.config}
        seats={match.seats}
        endActions={
          <>
            <button onClick={() => setMatch(newMatch(setup, match.opponent, match.id + 1))}>
              Play again
            </button>
            <button className="secondary" onClick={() => setMatch(null)}>
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
      <OpponentPicker bots={PRESET_BOTS} onPick={(bot) => setMatch(newMatch(setup, bot, 1))} />
    </main>
  );
}
