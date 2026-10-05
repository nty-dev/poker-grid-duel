import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import type { PresetBot } from '../../bots/types';

interface OpponentPickerProps {
  bots: readonly PresetBot[];
  picked: PresetBot | null;
  onPick(bot: PresetBot): void;
}

export function OpponentPicker({ bots, picked, onPick }: OpponentPickerProps) {
  return (
    <div className="picker">
      {bots.map((bot) => {
        const isPicked = bot.id === picked?.id;
        return (
          <Card
            key={bot.id}
            variant="outlined"
            sx={isPicked ? { borderColor: 'secondary.main', borderWidth: 2 } : { borderWidth: 2 }}
          >
            <CardActionArea
              aria-pressed={isPicked}
              onClick={() => onPick(bot)}
              sx={{ p: 1.5, height: '100%' }}
            >
              <Typography sx={{ fontWeight: 600 }}>{bot.name}</Typography>
              <Typography variant="h5" color="secondary" sx={{ fontWeight: 700 }}>
                {bot.ratingFromTournament}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bot.description}
              </Typography>
            </CardActionArea>
          </Card>
        );
      })}
    </div>
  );
}
