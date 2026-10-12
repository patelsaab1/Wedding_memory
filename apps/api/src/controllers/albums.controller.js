import { createSuccessResponse } from '@wedding-memory/shared';
import * as albumService from '../services/albums/album.service.js';

export async function listAlbums(req, res) {
  const result = await albumService.listAlbums(req.query);
  res.status(200).json(createSuccessResponse(result.items, result.meta));
}

export async function getAlbum(req, res) {
  const album = await albumService.getAlbumById(req.params.id);
  res.status(200).json(createSuccessResponse(album));
}
