import storyMap from './storyMap';

const toLabel = (key) =>
  key.replace(/([a-z])(\d)/i, '$1 $2').replace(/^./, (c) => c.toUpperCase());

export const SCENES = Object.keys(storyMap).map((key) => ({
  key,
  label: toLabel(key),
}));
