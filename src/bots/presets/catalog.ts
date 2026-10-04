import type { PresetBot, PresetId } from '../types';

type PresetInfo = Omit<PresetBot, 'source'>;

const PRESET_INFO: readonly PresetInfo[] = [
  {
    id: 'random',
    name: 'Random',
    description: 'Places each card in a random empty cell.',
    ratingFromTournament: 800,
  },
  {
    id: 'greedy',
    name: 'Greedy',
    description: 'Best immediate change in line potential, mine minus yours.',
    ratingFromTournament: 1354,
  },
  {
    id: 'montecarlo',
    name: 'Monte Carlo',
    description: 'Plays 100 random futures per candidate cell.',
    ratingFromTournament: 1576,
  },
];

export function presetBots(loadSourceOfPresetFile: (id: PresetId) => string): PresetBot[] {
  return PRESET_INFO.map((info) => ({ ...info, source: loadSourceOfPresetFile(info.id) }));
}
