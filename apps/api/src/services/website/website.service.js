import { toPublicJson, WEBSITE_SECTION_TYPES } from '@wedding-memory/shared';
import { notFoundError, badRequestError } from '../../utils/errors.js';
import * as websiteSectionRepository from '../../repositories/website-section.repository.js';

const HOME_SECTIONS = [
  {
    key: 'hero',
    title: 'Rohit & Roshni',
    type: WEBSITE_SECTION_TYPES.HERO,
    sortOrder: 0,
    configuration: {
      eyebrow: 'Private collection',
      description: 'The wedding day, kept for the family. Scroll through the hours, then the photographs that stayed.',
    },
  },
  {
    key: 'couple_story',
    title: 'Us.',
    type: WEBSITE_SECTION_TYPES.STORY,
    sortOrder: 1,
    configuration: {
      eyebrow: 'Together',
      description: 'Roshni. Rohit. The look between them, and the day two lives became one house.',
    },
  },
  {
    key: 'art_wall',
    title: 'The memory wall',
    type: WEBSITE_SECTION_TYPES.ART_WALL,
    sortOrder: 2,
    configuration: {
      eyebrow: 'Exhibition',
      description: 'A private wall of the photographs we keep closest.',
    },
  },
  {
    key: 'cinematic_reveal',
    title: 'Together.',
    type: WEBSITE_SECTION_TYPES.CINEMATIC_REVEAL,
    sortOrder: 3,
    configuration: {
      eyebrow: 'A quiet reveal',
      description: 'One frame, then the day gathers around it.',
    },
  },
  {
    key: 'couple_gallery',
    title: 'In the gallery',
    type: WEBSITE_SECTION_TYPES.COUPLE_GALLERY,
    sortOrder: 4,
    configuration: {
      eyebrow: 'Art prints',
      description: 'A few photographs hung as prints, not as a grid.',
    },
  },
  {
    key: 'floating_collage',
    title: 'Around them',
    type: WEBSITE_SECTION_TYPES.FLOATING_COLLAGE,
    sortOrder: 5,
    configuration: {
      eyebrow: 'Depth',
      description: 'The portrait in the centre. The day resting nearby.',
    },
  },
  {
    key: 'cinematic_wide',
    title: 'The wide frame',
    type: WEBSITE_SECTION_TYPES.CINEMATIC_WIDE,
    sortOrder: 6,
    configuration: {
      eyebrow: 'Cinematic',
      description: 'A wide look at the two of them. A drone frame can take this place later.',
    },
  },
  {
    key: 'slider',
    title: 'A slow look through the frames',
    type: WEBSITE_SECTION_TYPES.GALLERY,
    sortOrder: 7,
    configuration: {
      eyebrow: 'From the day',
      description: 'These photographs move on their own. Pause them by resting on the picture.',
    },
  },
  {
    key: 'timeline',
    title: 'From tel to forever',
    type: WEBSITE_SECTION_TYPES.TIMELINE,
    sortOrder: 8,
    configuration: {
      eyebrow: 'Our story',
      description: 'Four days the family gathered. Tel, haldi, sangeet, and then the vows. On 1 May, Roshni became Rohit’s life partner and ardhangini.',
    },
  },
  {
    key: 'ways',
    title: 'Three ways in',
    type: WEBSITE_SECTION_TYPES.STORY,
    sortOrder: 9,
    configuration: {
      eyebrow: 'The day',
      description: 'Start with the haldi, the featured frames, or the full album list.',
    },
  },
  {
    key: 'scattered',
    title: 'Photographs the scroll finds',
    type: WEBSITE_SECTION_TYPES.GALLERY,
    sortOrder: 10,
    configuration: {
      eyebrow: 'In passing',
      description: 'A small set of the two of them, hung the way the rest of the house is hung.',
    },
  },
  {
    key: 'highlights',
    title: 'The frames we return to',
    type: WEBSITE_SECTION_TYPES.GALLERY,
    sortOrder: 11,
    configuration: {
      eyebrow: 'Highlighted',
      description: 'A few photographs of Rohit and Roshni kept at the front of the collection.',
    },
  },
  {
    key: 'closing',
    title: 'Forever.',
    type: WEBSITE_SECTION_TYPES.CUSTOM,
    sortOrder: 12,
    configuration: {
      eyebrow: 'The last look',
      description: 'One photograph to leave with.',
    },
  },
  {
    key: 'private',
    title: 'This house stays private',
    type: WEBSITE_SECTION_TYPES.FAMILY,
    sortOrder: 13,
    configuration: {
      eyebrow: 'Email and password',
      description: 'The photographs open with the email and password given to you. Super admin holds the master login the same way — not through Google.',
    },
  },
  {
    key: 'album_note',
    title: 'For you',
    type: WEBSITE_SECTION_TYPES.CUSTOM,
    sortOrder: 14,
    configuration: {
      eyebrow: 'A note',
      description: 'Turn the page. These photographs are kept for the family.',
    },
  },
];

/** Order shipped before the exhibition sections. Used only to place new sections once. */
const ORIGINAL_HOME_ORDER = ['hero', 'slider', 'timeline', 'ways', 'scattered', 'highlights', 'private'];

const HOME_KEYS = new Set(HOME_SECTIONS.map((section) => section.key));

function mapSection(doc) {
  const json = toPublicJson(doc);
  const configuration = json.configuration && typeof json.configuration === 'object' ? json.configuration : {};
  return {
    id: json.id,
    key: json.key,
    title: json.title,
    type: json.type,
    enabled: json.enabled !== false,
    sortOrder: json.sortOrder ?? 0,
    eyebrow: typeof configuration.eyebrow === 'string' ? configuration.eyebrow : '',
    description: typeof configuration.description === 'string' ? configuration.description : '',
  };
}

export async function ensureHomeSections() {
  const existing = await websiteSectionRepository.findWebsiteSections({
    sort: { sortOrder: 1, createdAt: 1 },
  });

  if (existing.length === 0) {
    await websiteSectionRepository.insertWebsiteSections(
      HOME_SECTIONS.map((section) => ({ ...section, enabled: true })),
    );
    return;
  }

  const byKey = new Map(existing.map((section) => [section.key, section]));
  const missing = HOME_SECTIONS.filter((section) => !byKey.has(section.key));
  const homeDocs = existing.filter((section) => ORIGINAL_HOME_ORDER.includes(section.key));
  const stillSeedOrder = homeDocs.length === ORIGINAL_HOME_ORDER.length
    && ORIGINAL_HOME_ORDER.every((key, index) => homeDocs[index]?.key === key);

  if (missing.length) {
    const maxOrder = existing.reduce((max, section) => Math.max(max, section.sortOrder ?? 0), 0);
    await websiteSectionRepository.insertWebsiteSections(
      missing.map((section, index) => ({
        ...section,
        enabled: true,
        sortOrder: stillSeedOrder ? section.sortOrder : maxOrder + 1 + index,
      })),
    );
  }

  if (stillSeedOrder && missing.length) {
    await websiteSectionRepository.reorderWebsiteSections(HOME_SECTIONS.map((section) => section.key));
  }
}

/**
 * @param {Record<string, unknown>} input
 */
export async function createWebsiteSection(input) {
  const section = await websiteSectionRepository.createWebsiteSection(input);
  return mapSection(section);
}

/**
 * @param {{ enabledOnly?: boolean }} [options]
 */
export async function listWebsiteSections(options = {}) {
  await ensureHomeSections();
  const filter = {};
  if (options.enabledOnly) {
    filter.enabled = true;
  }

  const items = await websiteSectionRepository.findWebsiteSections({
    filter,
    sort: { sortOrder: 1, createdAt: 1 },
  });
  return items.map(mapSection);
}

/**
 * @param {string} key
 * @param {{ title?: string, eyebrow?: string, description?: string, enabled?: boolean }} input
 */
export async function updateHomeSection(key, input) {
  if (!HOME_KEYS.has(key)) {
    throw notFoundError('That home section does not exist');
  }

  await ensureHomeSections();
  const current = (await websiteSectionRepository.findWebsiteSections({ filter: { key } }))[0];
  if (!current) {
    throw notFoundError('That home section does not exist');
  }

  const configuration = {
    ...(current.configuration || {}),
    eyebrow: input.eyebrow ?? current.configuration?.eyebrow ?? '',
    description: input.description ?? current.configuration?.description ?? '',
  };

  const updated = await websiteSectionRepository.updateWebsiteSectionByKey(key, {
    title: input.title ?? current.title,
    enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
    configuration,
  });

  return mapSection(updated);
}

/**
 * @param {string[]} keys
 */
export async function reorderHomeSections(keys) {
  await ensureHomeSections();
  const unique = [...new Set(keys)];
  if (unique.length !== HOME_SECTIONS.length || unique.some((key) => !HOME_KEYS.has(key))) {
    throw badRequestError('Send every home section key, once each');
  }
  await websiteSectionRepository.reorderWebsiteSections(unique);
  return listWebsiteSections();
}
