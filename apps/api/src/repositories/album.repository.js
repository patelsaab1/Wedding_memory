import { Album } from '../models/album.model.js';

/**
 * @param {Record<string, unknown>} data
 */
export async function createAlbum(data) {
  const album = await Album.create(data);
  return album.toJSON();
}

/**
 * @param {string} id
 */
export async function findAlbumById(id) {
  return Album.findById(id).lean();
}

/**
 * @param {{ filter?: Record<string, unknown>, skip: number, limit: number, sort?: Record<string, 1 | -1> }} options
 */
export async function findAlbums({
  filter = {},
  skip,
  limit,
  sort = { sortOrder: 1, createdAt: -1 },
}) {
  const [items, total] = await Promise.all([
    Album.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Album.countDocuments(filter),
  ]);

  return { items, total };
}
