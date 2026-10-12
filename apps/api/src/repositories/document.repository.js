import { Document } from '../models/document.model.js';

/**
 * @param {Record<string, unknown>} data
 */
export async function createDocument(data) {
  const document = await Document.create(data);
  return document.toJSON();
}

/**
 * @param {{ filter?: Record<string, unknown>, skip: number, limit: number, sort?: Record<string, 1 | -1> }} options
 */
export async function findDocuments({ filter = {}, skip, limit, sort = { createdAt: -1 } }) {
  const [items, total] = await Promise.all([
    Document.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Document.countDocuments(filter),
  ]);

  return { items, total };
}
