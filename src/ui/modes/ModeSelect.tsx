export type Mode = 'humanVsHuman' | 'humanVsBot';

const MODES: readonly { id: Mode; title: string; summary: string }[] = [
  { id: 'humanVsHuman', title: 'Human vs Human', summary: 'Pass-and-play on this device.' },
  {
    id: 'humanVsBot',
    title: 'Human vs Bot',
    summary: 'Play a preset bot. Your Elo rating updates.',
  },
];

export function ModeSelect({ onSelect }: { onSelect(mode: Mode): void }) {
  return (
    <main className="home">
      <section>
        <h2>Choose a mode</h2>
        <div className="picker">
          {MODES.map((mode) => (
            <button key={mode.id} className="opponent" onClick={() => onSelect(mode.id)}>
              <span className="opponent-name">{mode.title}</span>
              <span className="opponent-desc">{mode.summary}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel rules">
        <h2>How to play</h2>
        <p>
          Two players share a 5×5 board. One scores the five <b>rows</b> as poker hands, the other
          the five <b>columns</b>. Every card counts for both.
        </p>
        <p>
          On your turn, place the current card in any empty cell. The next card is visible to both
          players. The game ends when all 25 cells are full.
        </p>
        <p>
          Pair 2 · Two pair 5 · Trips 10 · Flush 12 · Straight 15 · Full house 20 · Quads 40 ·
          Straight flush 60.
        </p>
      </section>
    </main>
  );
}
