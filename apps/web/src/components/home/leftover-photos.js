function frame(file, local, alt, extra = {}) {
  const folder = extra.folder || 'more';
  const rest = { ...extra };
  delete rest.folder;
  return {
    id: `leftover-${local}`,
    file,
    name: alt,
    alt,
    previewPath: `/${folder}/${local}.webp`,
    fullPath: `/${folder}/${local}.jpg`,
    ...rest,
  };
}

export const TOGETHER_FRAMES = [
  frame('intimate.png', 'intimate', 'Rohit holding Roshni, her face in his hand'),
  frame('4Q3A8675.JPG', 'close', 'Rohit and Roshni, almost a kiss'),
  frame('4Q3A8644.JPG', 'lookup', 'Roshni looking up at Rohit'),
  frame('4Q3A8599.JPG', 'blessing', 'Roshni resting her hand on Rohit'),
];

export const PRINT_FRAMES = [
  frame('4Q3A8428.JPG', 'veil', 'Roshni looking down through her veil', {
    caption: 'The veil',
  }),
  frame('romantic.png', 'romantic', 'Roshni looking up at Rohit outdoors', {
    caption: 'That look',
  }),
  frame('4Q3A8688.JPG', 'vows', 'Hands meeting at the pheras', {
    caption: 'The hold',
  }),
  frame('warmth.png', 'warmth', 'Rohit and Roshni seated together', {
    caption: 'Together',
  }),
];

export const WIDE_FRAMES = [
  frame('seated.png', 'seated', 'Rohit seated on the terrace with his sword'),
  frame('romantic.png', 'romantic', 'Roshni looking up at Rohit outdoors'),
  frame('4Q3A8692.JPG', 'sehra', 'Rohit and Roshni under the sehra'),
];

export const SCATTERED_FRAMES = [
  frame('intimate.png', 'intimate', 'Held close'),
  frame('4Q3A8437.JPG', 'henna', 'Roshni and her henna', { folder: 'wall' }),
  frame('romantic.png', 'romantic', 'Roshni looking up'),
  frame('4Q3A8599.JPG', 'blessing', 'Her hand on him'),
  frame('warmth.png', 'warmth', 'Seated together'),
  frame('4Q3A8610.JPG', 'foreground', 'Roshni close, Rohit behind'),
  frame('4Q3A8445.JPG', 'nath', 'Roshni looking back', { folder: 'wall' }),
  frame('4Q3A8675.JPG', 'close', 'Almost a kiss'),
];

export const HIGHLIGHT_FRAMES = [
  frame('intimate.png', 'intimate', 'Rohit holding Roshni'),
  frame('warmth.png', 'warmth', 'Seated together'),
  frame('romantic.png', 'romantic', 'That look outdoors'),
  frame('4Q3A8599.JPG', 'blessing', 'Roshni with Rohit'),
  frame('4Q3A8692.JPG', 'sehra', 'Under the sehra'),
  frame('4Q3A8437.JPG', 'henna', 'Roshni in gold', { folder: 'wall' }),
];

export const CLOSING_FRAME = frame(
  'intimate.png',
  'intimate',
  'Rohit holding Roshni, forever',
);
