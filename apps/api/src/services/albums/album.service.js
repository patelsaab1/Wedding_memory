import { createPaginationMeta, toPublicJson } from '@wedding-memory/shared';
import { notFoundError } from '../../utils/errors.js';
import * as albumRepository from '../../repositories/album.repository.js';

function mapAlbum(doc) {
  return toPublicJson(doc);
}

/**
 * Create album (service-layer; HTTP POST not exposed in this phase).
 * @param {Record<string, unknown>} input
 */
export async function createAlbum(input) {
  const album = await albumRepository.createAlbum(input);
  return mapAlbum(album);
}

/**
 * @param {string} id
 */
export async function getAlbumById(id) {
  const album = await albumRepository.findAlbumById(id);
  if (!album) {
    throw notFoundError('Album not found');
  }
  return mapAlbum(album);
}

/**
 * @param {{ page: number, limit: number, isPublished?: boolean, category?: string }} query
 */
export async function listAlbums(query) {
  const { page, limit, isPublished, category } = query;
  const filter = {};

  if (typeof isPublished === 'boolean') {
    filter.isPublished = isPublished;
  }
  if (category) {
    filter.category = category;
  }

  const skip = (page - 1) * limit;
  const { items, total } = await albumRepository.findAlbums({ filter, skip, limit });

  return {
    items: items.map(mapAlbum),
    meta: createPaginationMeta({ page, limit, total }),
  };
}
