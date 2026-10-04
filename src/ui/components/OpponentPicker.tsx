import type { PresetBot } from '../../bots/types';

interface OpponentPickerProps {
  bots: readonly PresetBot[];
  onPick(bot: PresetBot): void;
}

export function OpponentPicker({ bots, onPick }: OpponentPickerProps) {
  return (
    <div className="picker">
      {bots.map((bot) => (
        <button key={bot.id} className="opponent" onClick={() => onPick(bot)}>
          <span className="opponent-name">{bot.name}</span>
          <span className="opponent-rating">{bot.ratingFromTournament}</span>
          <span className="opponent-desc">{bot.description}</span>
        </button>
      ))}
    </div>
  );
}
