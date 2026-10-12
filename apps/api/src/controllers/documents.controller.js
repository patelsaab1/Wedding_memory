import { createSuccessResponse } from '@wedding-memory/shared';
import * as documentService from '../services/documents/document.service.js';

export async function listDocuments(req, res) {
  const result = await documentService.listDocuments(req.query);
  res.status(200).json(createSuccessResponse(result.items, result.meta));
}
