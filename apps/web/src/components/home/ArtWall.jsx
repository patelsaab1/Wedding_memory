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
 *   }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function ArtWall({ id, eyebrow, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const narrow = useNarrow();
  useSoftParallax(ref);
  const frames = photos.slice(0, narrow ? 5 : photos.length);

  return (
    <section id={id} ref={ref} className={`art-wall salon-wall scroll-mt-20 ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
        <div className="salon-intro">
          <p className="salon-mark">01</p>
          <div>
            <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">
              {eyebrow || 'Exhibition'}
            </p>
            <h2 className="font-serif mt-3 max-w-xl text-[clamp(2.2rem,9vw,3.75rem)] leading-[1.08]">
              {title}
            </h2>
            <p className="salon-pair">
              Rohit <span aria-hidden="true">♥</span> Roshni
            </p>
            {description ? (
              <p className="text-muted mt-4 max-w-md text-sm leading-relaxed">{description}</p>
            ) : null}
          </div>
        </div>

        {frames.length ? (
          <div className="salon-stage">
            {frames.map((photo, index) => (
              <ArtisticPhoto
                key={photo.id}
                photo={photo}
                treatment={photo.treatment || 'frame'}
                label={photo.name}
                caption={photo.caption}
                rotate={photo.rotate || 0}
                depth={photo.depth || 10}
                className={photo.place || ''}
                onOpen={() => onOpen(index)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted mt-10 text-sm">The wall fills from the photographs already in the gallery.</p>
        )}
      </div>
    </section>
  );
}
