import { WebsiteSection } from '../models/website-section.model.js';

/**
 * @param {Record<string, unknown>} data
 */
export async function createWebsiteSection(data) {
  const section = await WebsiteSection.create(data);
  return section.toJSON();
}

/**
 * @param {{ filter?: Record<string, unknown>, sort?: Record<string, 1 | -1> }} options
 */
export async function findWebsiteSections({
  filter = {},
  sort = { sortOrder: 1, createdAt: -1 },
} = {}) {
  return WebsiteSection.find(filter).sort(sort).lean();
}

export async function countWebsiteSections() {
  return WebsiteSection.countDocuments();
}

/**
 * @param {Array<Record<string, unknown>>} sections
 */
export async function insertWebsiteSections(sections) {
  return WebsiteSection.insertMany(sections);
}

/**
 * @param {string} key
 * @param {Record<string, unknown>} update
 */
export async function updateWebsiteSectionByKey(key, update) {
  return WebsiteSection.findOneAndUpdate({ key }, update, { new: true }).lean();
}

/**
 * @param {string[]} keys
 */
export async function reorderWebsiteSections(keys) {
  await Promise.all(
    keys.map((key, index) => WebsiteSection.updateOne({ key }, { sortOrder: index })),
  );
}
