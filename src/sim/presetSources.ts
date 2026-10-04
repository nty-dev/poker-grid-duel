import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { presetBots, type PresetId } from '../bots/presets/catalog';
import type { PresetBot } from '../bots/types';

export function readPresetSourceFromDisk(id: PresetId): string {
  const fileUrl = new URL(`../bots/presets/${id}.js`, import.meta.url);
  return readFileSync(fileURLToPath(fileUrl), 'utf8');
}

export function loadPresetBotsFromDisk(): PresetBot[] {
  return presetBots(readPresetSourceFromDisk);
}
