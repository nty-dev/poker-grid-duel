import type { PresetBot } from '../../bots/types';

interface OpponentPickerProps {
  bots: readonly PresetBot[];
  picked: PresetBot | null;
  onPick(bot: PresetBot): void;
}

export function OpponentPicker({ bots, picked, onPick }: OpponentPickerProps) {
  return (
    <div className="picker">
      {bots.map((bot) => (
        <button
          key={bot.id}
          className={bot.id === picked?.id ? 'opponent picked' : 'opponent'}
          aria-pressed={bot.id === picked?.id}
          onClick={() => onPick(bot)}
        >
          <span className="opponent-name">{bot.name}</span>
          <span className="opponent-rating">{bot.ratingFromTournament}</span>
          <span className="opponent-desc">{bot.description}</span>
        </button>
      ))}
    </div>
  );
}
