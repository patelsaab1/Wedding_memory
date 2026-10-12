import { createSuccessResponse } from '@wedding-memory/shared';
import * as mediaService from '../services/media/media.service.js';

export async function listMedia(req, res) {
  const result = await mediaService.listMedia(req.query);
  res.status(200).json(createSuccessResponse(result.items, result.meta));
}

export async function getMedia(req, res) {
  const media = await mediaService.getMediaById(req.params.id);
  res.status(200).json(createSuccessResponse(media));
}
