import { useEffect, useState } from 'react';

/**
 * Photograph that prefers Drive, then the local house file.
 */
export function HouseImg({ photo, alt, className, loading = 'lazy', decoding = 'async', full = false, style }) {
  const { src, onError } = useHouseSrc(photo, { full });
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt ?? photo?.alt ?? photo?.name ?? 'Wedding photograph'}
      className={className}
      loading={loading}
      decoding={decoding}
      style={style}
      onError={onError}
    />
  );
}

/**
 * Prefer the Drive stream. If that file cannot load, fall back to the local house photograph.
 * @param {{ previewPath?: string, fullPath?: string, localPath?: string, localFull?: string } | null | undefined} photo
 * @param {{ full?: boolean }} [options]
 */
export function useHouseSrc(photo, options = {}) {
  const remote = options.full
    ? photo?.fullPath || photo?.previewPath || ''
    : photo?.previewPath || '';
  const local = options.full
    ? photo?.localFull || photo?.localPath || ''
    : photo?.localPath || photo?.localFull || '';
  const [src, setSrc] = useState(remote || local);

  useEffect(() => {
    setSrc(remote || local);
  }, [remote, local]);

  return {
    src: src || undefined,
    onError() {
      if (local && src !== local) setSrc(local);
    },
  };
}
