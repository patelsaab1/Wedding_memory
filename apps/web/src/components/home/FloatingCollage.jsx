import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { useInView, useNarrow, useSoftParallax } from '@/components/gallery/useGalleryMotion';

const ORBIT = [
  { label: 'couple-art-01', treatment: 'polaroid', place: 'orbit-a', rotate: -6, depth: 20, mobile: true },
  { label: 'couple-candid', treatment: 'pinned', place: 'orbit-b', rotate: 5, depth: 14, mobile: true },
  { label: 'couple-portrait', treatment: 'fine', place: 'orbit-c', rotate: -3, depth: 10, mobile: false },
  { label: 'couple-art-02', treatment: 'pinned', place: 'orbit-d', rotate: 4, depth: 18, mobile: false },
  { label: 'couple-wide', treatment: 'film', place: 'orbit-e', rotate: -2, depth: 8, mobile: false },
];

/**
 * @param {{
 *   eyebrow?: string,
 *   title: string,
 *   description?: string,
 *   photos: Array<{ id: string, name: string, previewPath: string }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function FloatingCollage({ eyebrow, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const narrow = useNarrow();
  useSoftParallax(ref);
  const center = photos[0];
  const orbit = photos.slice(1, 1 + (narrow ? 2 : ORBIT.length));

  return (
    <section ref={ref} className={`float-section ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-gold text-center text-[11px] font-medium tracking-[0.32em] uppercase">{eyebrow || 'Depth'}</p>
        <h2 className="font-serif mt-3 text-center text-4xl sm:text-6xl">{title}</h2>
        {description ? <p className="text-muted mx-auto mt-4 max-w-md text-center text-sm leading-relaxed">{description}</p> : null}
        {center ? (
          <div className="float-stage">
            <ArtisticPhoto
              photo={center}
              treatment="frame"
              label="couple-main"
              depth={8}
              className="float-center"
              onOpen={() => onOpen(0)}
            />
            {orbit.map((photo, index) => {
              const spot = ORBIT[index];
              return (
                <ArtisticPhoto
                  key={`${photo.id}-${spot.place}`}
                  photo={photo}
                  treatment={spot.treatment}
                  label={spot.label}
                  rotate={spot.rotate}
                  depth={spot.depth}
                  className={`${spot.place} ${spot.mobile ? 'orbit-keep' : 'orbit-desk'}`}
                  onOpen={() => onOpen(index + 1)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted mt-10 text-center text-sm">A centre portrait will sit here.</p>
        )}
      </div>
    </section>
  );
}
