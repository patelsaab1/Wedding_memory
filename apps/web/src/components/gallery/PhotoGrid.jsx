import { useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { PhotoLightbox } from '@/components/gallery/PhotoLightbox';

/**
 * @param {{
 *   item: { id: string, name: string, previewPath: string, kind?: string },
 *   className?: string,
 *   layout?: 'tile' | 'strip',
 *   onOpen?: () => void,
 * }} props
 */
export function GalleryMedia({ item, className = '', layout = 'tile', onOpen }) {
  const imageClass =
    layout === 'strip'
      ? 'h-64 w-full object-cover sm:h-96'
      : 'aspect-[4/5] h-full w-full object-cover';
  const videoClass =
    layout === 'strip' ? 'h-64 w-full bg-black object-cover sm:h-96' : 'aspect-video w-full bg-black';

  if (item.kind === 'video') {
    return (
      <figure className={`photo-frame bg-ink ${className}`}>
        <video
          src={item.previewPath}
          controls
          playsInline
          preload="metadata"
          className={videoClass}
          aria-label={item.name}
        />
        <figcaption className="px-3 py-2 text-[11px] tracking-[0.18em] text-white/80 uppercase">
          Film
        </figcaption>
      </figure>
    );
  }

  const figure = (
    <figure className={`photo-frame ${className}`}>
      <img
        src={item.previewPath}
        alt={item.name}
        loading="lazy"
        decoding="async"
        className={imageClass}
      />
    </figure>
  );

  if (!onOpen) return figure;

  return (
    <button type="button" className="block w-full text-left" onClick={onOpen} aria-label={`Open ${item.name}`}>
      {figure}
    </button>
  );
}

/**
 * @param {{ photos: Array<{ id: string, name: string, previewPath: string, kind?: string }>, className?: string }} props
 */
export function PhotoGrid({ photos, className = '' }) {
  const stills = (photos || []).filter((photo) => photo?.previewPath && photo.kind !== 'video');
  const [index, setIndex] = useState(null);

  if (!photos?.length) {
    return null;
  }

  return (
    <>
      <div className={`editorial-grid ${className}`}>
        {photos.map((photo, photoIndex) => {
          const stillIndex = stills.findIndex((item) => item.id === photo.id);
          const wide = photoIndex % 5 === 0;
          return (
            <Reveal key={photo.id} delay={Math.min(photoIndex, 6) * 40} className={wide ? 'editorial-wide' : ''}>
              <GalleryMedia
                item={photo}
                onOpen={stillIndex >= 0 ? () => setIndex(stillIndex) : undefined}
              />
            </Reveal>
          );
        })}
      </div>
      <PhotoLightbox
        photos={stills}
        index={index}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
      />
    </>
  );
}
