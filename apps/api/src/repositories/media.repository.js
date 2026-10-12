import { Media } from '../models/media.model.js';

/**
 * @param {Record<string, unknown>} data
 */
export async function createMedia(data) {
  const media = await Media.create(data);
  return media.toJSON();
}

/**
 * @param {string} id
 */
export async function findMediaById(id) {
  return Media.findById(id).lean();
}

/**
 * @param {{ filter?: Record<string, unknown>, skip: number, limit: number, sort?: Record<string, 1 | -1> }} options
 */
export async function findMediaList({ filter = {}, skip, limit, sort = { createdAt: -1 } }) {
  const [items, total] = await Promise.all([
    Media.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Media.countDocuments(filter),
  ]);

  return { items, total };
}
