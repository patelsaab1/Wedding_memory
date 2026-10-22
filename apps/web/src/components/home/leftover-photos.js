function frame(file, local, alt, extra = {}) {
  return {
    id: `leftover-${local}`,
    file,
    name: alt,
    alt,
    previewPath: `/more/${local}.webp`,
    fullPath: `/more/${local}.jpg`,
    ...extra,
  };
}

export const TOGETHER_FRAMES = [
  frame('4Q3A8675.JPG', 'close', 'Rohit and Roshni, almost a kiss'),
  frame('4Q3A8644.JPG', 'lookup', 'Roshni looking up at Rohit'),
  frame('4Q3A9120.JPG', 'hold', 'Rohit holding Roshni close'),
  frame('4Q3A8667.JPG', 'darkhold', 'Forehead to forehead in the dark'),
];

export const PRINT_FRAMES = [
  frame('4Q3A8428.JPG', 'veil', 'Roshni looking down through her veil', {
    caption: 'The veil',
  }),
  frame('4Q3A8692.JPG', 'sehra', 'Rohit and Roshni under the sehra', {
    caption: 'Under the sehra',
  }),
  frame('4Q3A8688.JPG', 'vows', 'Hands meeting at the pheras', {
    caption: 'The hold',
  }),
  frame('4Q3A9100.JPG', 'hug', 'Rohit holding Roshni against the wall', {
    caption: 'Close',
  }),
];

export const WIDE_FRAMES = [
  frame('4Q3A9056.JPG', 'terrace', 'Rohit and Roshni standing together outdoors'),
  frame('4Q3A9160.JPG', 'column', 'Rohit in sehra beside a stone column'),
  frame('4Q3A8692.JPG', 'sehra', 'Rohit and Roshni under the sehra'),
];

export const SCATTERED_FRAMES = [
  frame('4Q3A8675.JPG', 'close', 'Almost a kiss'),
  frame('4Q3A8428.JPG', 'veil', 'Roshni through the veil'),
  frame('4Q3A8644.JPG', 'lookup', 'Roshni looking up'),
  frame('4Q3A9120.JPG', 'hold', 'The hold'),
  frame('4Q3A9056.JPG', 'terrace', 'Together outdoors'),
  frame('4Q3A8667.JPG', 'darkhold', 'Forehead to forehead'),
  frame('4Q3A8688.JPG', 'vows', 'Hands at the pheras'),
  frame('4Q3A9160.JPG', 'column', 'Rohit outdoors'),
];

export const HIGHLIGHT_FRAMES = [
  frame('4Q3A8675.JPG', 'close', 'Almost a kiss'),
  frame('4Q3A8692.JPG', 'sehra', 'Under the sehra'),
  frame('4Q3A9056.JPG', 'terrace', 'Together outdoors'),
  frame('4Q3A9100.JPG', 'hug', 'Held close'),
  frame('4Q3A8667.JPG', 'darkhold', 'Forehead to forehead'),
  frame('4Q3A9120.JPG', 'hold', 'Rohit holding Roshni'),
];

export const CLOSING_FRAME = frame(
  '4Q3A8692.JPG',
  'sehra',
  'Rohit and Roshni under the sehra, forever',
);
