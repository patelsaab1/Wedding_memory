import { createSuccessResponse, hasPermission, PERMISSIONS } from '@wedding-memory/shared';
import * as galleryService from '../services/gallery/gallery.service.js';

function viewerCanWatchFilms(user) {
  return hasPermission(user, PERMISSIONS.VIDEO_VIEW);
}

export async function getGallery(req, res) {
  const gallery = await galleryService.getWeddingGallery({
    includeVideos: viewerCanWatchFilms(req.user),
    user: req.user,
  });
  res.status(200).json(createSuccessResponse(gallery));
}

export async function getAlbum(req, res) {
  const album = await galleryService.getGalleryAlbum(req.params.folderId, req.query, {
    includeVideos: viewerCanWatchFilms(req.user),
    user: req.user,
  });
  res.status(200).json(createSuccessResponse(album));
}

export async function streamPhoto(req, res, next) {
  try {
    const file = await galleryService.openGalleryFile(req.params.fileId, {
      range: req.headers.range,
      allowVideo: viewerCanWatchFilms(req.user),
      preview: req.query.size === 'preview',
      user: req.user,
    });

    if (!file.stream) {
      res.status(416);
      res.setHeader('Accept-Ranges', 'bytes');
      if (file.contentRange) {
        res.setHeader('Content-Range', file.contentRange);
      }
      res.end();
      return;
    }

    res.status(file.statusCode === 206 ? 206 : 200);
    if (!file.preview) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', file.preview ? 'private, max-age=3600' : 'private, max-age=300');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (file.contentRange) {
      res.setHeader('Content-Range', file.contentRange);
    }
    if (file.contentLength) {
      res.setHeader('Content-Length', String(file.contentLength));
    }

    file.stream.on('error', (error) => {
      if (!res.headersSent) {
        next(error);
        return;
      }
      res.destroy(error);
    });
    file.stream.pipe(res);
  } catch (error) {
    next(error);
  }
}
