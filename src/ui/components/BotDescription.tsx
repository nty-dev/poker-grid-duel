import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BotCatalogEntry, BotId } from '../../bots/types';

const markdownByPath = import.meta.glob<string>('../../bots/strategies/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function descriptionMarkdown(id: BotId): string {
  const markdown = markdownByPath[`../../bots/strategies/${id}.md`];
  if (markdown === undefined) {
    throw new Error(`The "${id}" bot has no description: src/bots/strategies/${id}.md is missing.`);
  }
  return markdown;
}

interface BotDescriptionProps {
  bot: BotCatalogEntry;
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
