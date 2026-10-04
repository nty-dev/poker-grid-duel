import { presetBots, type PresetId } from '../bots/presets/catalog';
import type { PresetBot } from '../bots/types';

const sourceByPath = import.meta.glob<string>('../bots/presets/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function bundledPresetSource(id: PresetId): string {
  const source = sourceByPath[`../bots/presets/${id}.js`];
  if (source === undefined) {
    throw new Error(`The build did not include src/bots/presets/${id}.js for the "${id}" bot.`);
  }
  return source;
}

export const PRESET_BOTS: readonly PresetBot[] = presetBots(bundledPresetSource);
