import { AROUND_THEM } from '@/components/home/around-them';
import { COUPLE_STORY } from '@/components/home/couple-story';
import {
  CLOSING_FRAME,
  HIGHLIGHT_FRAMES,
  PRINT_FRAMES,
  SCATTERED_FRAMES,
  TOGETHER_FRAMES,
  WIDE_FRAMES,
} from '@/components/home/leftover-photos';
import { MEMORY_WALL } from '@/components/home/memory-wall';

function asLocal(photo) {
  const preview = photo.previewPath;
  const full = photo.fullPath || photo.previewPath;
  return {
    ...photo,
    localPath: photo.localPath || preview,
    localFull: photo.localFull || full,
  };
}

function collectHousePhotos() {
  const seen = new Set();
  const all = [
    ...TOGETHER_FRAMES,
    ...HIGHLIGHT_FRAMES,
    ...PRINT_FRAMES,
    ...WIDE_FRAMES,
    ...SCATTERED_FRAMES,
    CLOSING_FRAME,
    ...MEMORY_WALL,
    ...AROUND_THEM,
    ...COUPLE_STORY.chapters,
  ];

  return all
    .filter((photo) => {
      const key = photo?.previewPath;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(asLocal);
}

const HOUSE_FALLBACKS = collectHousePhotos();
const HOUSE_BY_FILE = new Map(
  HOUSE_FALLBACKS.filter((photo) => photo.file).map((photo) => [photo.file.toLowerCase(), photo]),
);

/**
 * Curated local photographs from the house image folder.
 * Used when Drive is empty, not ready, or a Drive file fails to load.
 */
export function houseFallbackPhotos() {
  return HOUSE_FALLBACKS;
}

export function attachLocalFallback(photo) {
  if (!photo) return photo;
  const match = HOUSE_BY_FILE.get(String(photo.name || '').toLowerCase());
  if (!match) return photo;
  return {
    ...photo,
    localPath: match.previewPath,
    localFull: match.fullPath || match.previewPath,
  };
}

export function withLocalFallback(photos) {
  return (photos || []).map(attachLocalFallback);
}
