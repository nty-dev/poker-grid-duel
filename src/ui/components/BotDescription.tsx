import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PresetBot, PresetId } from '../../bots/types';

const markdownByPath = import.meta.glob<string>('../../bots/presets/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function descriptionMarkdown(id: PresetId): string {
  const markdown = markdownByPath[`../../bots/presets/${id}.md`];
  if (markdown === undefined) {
    throw new Error(`The "${id}" bot has no description: src/bots/presets/${id}.md is missing.`);
  }
  return markdown;
}

interface BotDescriptionProps {
  bot: PresetBot;
  onDuel(): void;
}

export function BotDescription({ bot, onDuel }: BotDescriptionProps) {
  return (
    <Paper component="section" variant="outlined" className="bot-description" sx={{ p: 2 }}>
      <div className="bot-description-heading">
        <h2>
          {bot.name} · rated {bot.ratingFromTournament}
        </h2>
        <Button variant="contained" onClick={onDuel}>
          Duel
        </Button>
      </div>
      <Markdown remarkPlugins={[remarkGfm]}>{descriptionMarkdown(bot.id)}</Markdown>
    </Paper>
  );
}
