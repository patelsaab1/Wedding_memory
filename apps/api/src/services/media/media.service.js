import { createPaginationMeta, toPublicJson } from '@wedding-memory/shared';
import { notFoundError } from '../../utils/errors.js';
import * as mediaRepository from '../../repositories/media.repository.js';

function mapMedia(doc) {
  return toPublicJson(doc);
}

/**
 * @param {Record<string, unknown>} input
 */
export async function createMedia(input) {
  const media = await mediaRepository.createMedia(input);
  return mapMedia(media);
}

/**
 * @param {string} id
 */
export async function getMediaById(id) {
  const media = await mediaRepository.findMediaById(id);
  if (!media || media.isActive === false) {
    throw notFoundError('Media not found');
  }
  return mapMedia(media);
}

/**
 * @param {{
 *   page: number,
 *   limit: number,
 *   albumId?: string,
 *   mediaType?: string,
 *   provider?: string,
 *   visibility?: string,
 * }} query
 */
export async function listMedia(query) {
  const { page, limit, albumId, mediaType, provider, visibility } = query;
  const filter = { isActive: true };

  if (albumId) filter.albumId = albumId;
  if (mediaType) filter.mediaType = mediaType;
  if (provider) filter.provider = provider;
  if (visibility) filter.visibility = visibility;

  const skip = (page - 1) * limit;
  const { items, total } = await mediaRepository.findMediaList({ filter, skip, limit });

  return {
    items: items.map(mapMedia),
    meta: createPaginationMeta({ page, limit, total }),
  };
}
