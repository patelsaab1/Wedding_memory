import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { useInView, useNarrow, useSoftParallax } from '@/components/gallery/useGalleryMotion';

/**
 * @param {{
 *   id?: string,
 *   eyebrow?: string,
 *   title: string,
 *   description?: string,
 *   photos: Array<{
 *     id: string,
 *     name: string,
 *     alt?: string,
 *     previewPath: string,
 *     place?: string,
 *     treatment?: string,
 *     rotate?: number,
 *     depth?: number,
 *     caption?: string,
 *     mobile?: boolean,
 *   }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function FloatingCollage({ id, eyebrow, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const narrow = useNarrow();
  useSoftParallax(ref);

  const frames = photos.filter((photo) => photo?.previewPath && (!narrow || photo.mobile !== false));
  const center = frames[0];
  const orbit = frames.slice(1);

  return (
    <section id={id} ref={ref} className={`float-section around-them scroll-mt-20 ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
        <p className="text-gold text-center text-[11px] font-medium tracking-[0.32em] uppercase">
          {eyebrow || 'Around them'}
        </p>
        <h2 className="font-serif mt-3 text-center text-[clamp(2.2rem,9vw,3.75rem)] leading-[1.08]">{title}</h2>
        <p className="salon-pair around-pair">
          Rohit <span aria-hidden="true">♥</span> Roshni
        </p>
        {description ? (
          <p className="text-muted mx-auto mt-4 max-w-md text-center text-sm leading-relaxed">{description}</p>
        ) : null}
        {center ? (
          <div className="float-stage">
            {frames.map((photo, index) => (
              <ArtisticPhoto
                key={photo.id}
                photo={photo}
                treatment={photo.treatment || (index === 0 ? 'frame' : 'pinned')}
                label={photo.name}
                caption={photo.caption}
                rotate={photo.rotate || 0}
                depth={photo.depth || 10}
                className={`${photo.place || ''} ${photo.mobile ? 'orbit-keep' : index === 0 ? '' : 'orbit-desk'}`}
                onOpen={() => onOpen(photos.findIndex((item) => item.id === photo.id))}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted mt-10 text-center text-sm">A centre portrait will sit here.</p>
        )}
      </div>
    </section>
  );
}
