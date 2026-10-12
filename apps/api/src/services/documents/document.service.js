import { createPaginationMeta, toPublicJson } from '@wedding-memory/shared';
import * as documentRepository from '../../repositories/document.repository.js';

function mapDocument(doc) {
  return toPublicJson(doc);
}

/**
 * @param {Record<string, unknown>} input
 */
export async function createDocument(input) {
  const document = await documentRepository.createDocument(input);
  return mapDocument(document);
}

/**
 * @param {{
 *   page: number,
 *   limit: number,
 *   category?: string,
 *   visibility?: string,
 * }} query
 */
export async function listDocuments(query) {
  const { page, limit, category, visibility } = query;
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (visibility) filter.visibility = visibility;

  const skip = (page - 1) * limit;
  const { items, total } = await documentRepository.findDocuments({
    filter,
    skip,
    limit,
  });

  return {
    items: items.map(mapDocument),
    meta: createPaginationMeta({ page, limit, total }),
  };
}
