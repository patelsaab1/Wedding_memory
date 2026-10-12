import { useEffect, useRef, useState } from 'react';

/**
 * Full-screen viewer for photographs already loaded from the gallery.
 * @param {{
 *   photos: Array<{ id: string, name?: string, previewPath: string, fullPath?: string }>,
 *   index: number | null,
 *   onClose: () => void,
 *   onIndex: (index: number) => void,
 * }} props
 */
export function PhotoLightbox({ photos, index, onClose, onIndex }) {
  const open = index !== null && index >= 0 && photos[index];
  const startX = useRef(0);
  const onCloseRef = useRef(onClose);
  const onIndexRef = useRef(onIndex);
  const indexRef = useRef(index);
  const lengthRef = useRef(photos.length);
  onCloseRef.current = onClose;
  onIndexRef.current = onIndex;
  indexRef.current = index;
  lengthRef.current = photos.length;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => setEntered(true));

    const onKey = (event) => {
      const current = indexRef.current ?? 0;
      const total = lengthRef.current || 1;
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'ArrowRight') onIndexRef.current((current + 1) % total);
      if (event.key === 'ArrowLeft') onIndexRef.current((current - 1 + total) % total);
    };

    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  const photo = photos[index];

  return (
    <div
      className={`lightbox ${entered ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Photograph"
      onClick={onClose}
    >
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
        Close
      </button>
      <button
        type="button"
        className="lightbox-nav lightbox-prev"
        aria-label="Previous photograph"
        onClick={(event) => {
          event.stopPropagation();
          onIndex((index - 1 + photos.length) % photos.length);
        }}
      >
        Prev
      </button>
      <figure
        className="lightbox-figure"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          startX.current = event.changedTouches[0]?.clientX || 0;
        }}
        onTouchEnd={(event) => {
          const delta = (event.changedTouches[0]?.clientX || 0) - startX.current;
          if (Math.abs(delta) < 48) return;
          onIndex(delta < 0 ? (index + 1) % photos.length : (index - 1 + photos.length) % photos.length);
        }}
      >
        <img src={photo.fullPath || photo.previewPath} alt={photo.name || 'Wedding photograph'} className="lightbox-img" />
        <figcaption className="lightbox-caption">
          <span>{photo.name || 'Photograph'}</span>
          <span>
            {index + 1} / {photos.length}
          </span>
        </figcaption>
      </figure>
      <button
        type="button"
        className="lightbox-nav lightbox-next"
        aria-label="Next photograph"
        onClick={(event) => {
          event.stopPropagation();
          onIndex((index + 1) % photos.length);
        }}
      >
        Next
      </button>
    </div>
  );
}
