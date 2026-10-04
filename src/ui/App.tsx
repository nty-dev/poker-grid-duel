import { useState } from 'react';
import { HumanVsBot } from './modes/HumanVsBot';
import { HumanVsHuman } from './modes/HumanVsHuman';
import { ModeSelect, type Mode } from './modes/ModeSelect';

const MODE_TITLES: Record<Mode, string> = {
  humanVsHuman: 'Human vs Human',
  humanVsBot: 'Human vs Bot',
};

export function App() {
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <div className="app">
      <header>
        <h1>
          <button className="title-link" onClick={() => setMode(null)}>
            Poker Grid Duel
          </button>
          {mode && <span className="mode-title"> · {MODE_TITLES[mode]}</span>}
        </h1>
      </header>
      {mode === null && <ModeSelect onSelect={setMode} />}
      {mode === 'humanVsHuman' && <HumanVsHuman />}
      {mode === 'humanVsBot' && <HumanVsBot />}
    </div>
  );
}
