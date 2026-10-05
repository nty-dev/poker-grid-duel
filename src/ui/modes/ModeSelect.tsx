import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export type Mode = 'humanVsHuman' | 'humanVsBot';

const MODES: readonly { id: Mode; title: string; summary: string }[] = [
  { id: 'humanVsHuman', title: 'Human vs Human', summary: 'Pass-and-play on this device.' },
  { id: 'humanVsBot', title: 'Human vs Bot', summary: 'Play Random, Greedy or Monte Carlo.' },
];

export function ModeSelect({ onSelect }: { onSelect(mode: Mode): void }) {
  return (
    <main className="home">
      <section>
        <h2>Choose a mode</h2>
        <div className="picker">
          {MODES.map((mode) => (
            <Card key={mode.id} variant="outlined">
              <CardActionArea onClick={() => onSelect(mode.id)} sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 600 }}>{mode.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode.summary}
                </Typography>
              </CardActionArea>
            </Card>
          ))}
        </div>
      </section>
      <Paper component="section" variant="outlined" className="rules" sx={{ p: 2 }}>
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
      </Paper>
    </main>
  );
}
