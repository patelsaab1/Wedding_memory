import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { useInView, useNarrow, useSoftParallax } from '@/components/gallery/useGalleryMotion';

const PLACEMENTS = [
  { label: 'couple-main', treatment: 'frame', place: 'wall-a', rotate: -2.2, depth: 18 },
  { label: 'couple-portrait', treatment: 'fine', place: 'wall-b', rotate: 2.4, depth: 8, caption: 'Portrait' },
  { label: 'couple-candid', treatment: 'polaroid', place: 'wall-c', rotate: -5, depth: 24 },
  { label: 'couple-art-01', treatment: 'pinned', place: 'wall-d', rotate: 3.2, depth: 14 },
  { label: 'couple-wide', treatment: 'film', place: 'wall-e', rotate: -1, depth: 6, caption: 'Still' },
  { label: 'couple-art-02', treatment: 'pinned', place: 'wall-f', rotate: 4, depth: 16 },
  { label: 'couple-candid', treatment: 'editorial', place: 'wall-g', rotate: -3, depth: 12, caption: 'The day' },
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
export function ArtWall({ eyebrow, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const narrow = useNarrow();
  useSoftParallax(ref);
  const frames = photos.slice(0, narrow ? 4 : PLACEMENTS.length);

  return (
    <section ref={ref} className={`art-wall ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">{eyebrow || 'Exhibition'}</p>
        <h2 className="font-serif mt-3 max-w-xl text-4xl sm:text-6xl">{title}</h2>
        {description ? <p className="text-muted mt-4 max-w-md text-sm leading-relaxed">{description}</p> : null}
        {frames.length ? (
          <div className="art-wall-stage">
            {frames.map((photo, index) => {
              const placement = PLACEMENTS[index];
              return (
                <ArtisticPhoto
                  key={`${photo.id}-${placement.place}`}
                  photo={photo}
                  treatment={placement.treatment}
                  label={placement.label}
                  caption={placement.caption}
                  rotate={placement.rotate}
                  depth={placement.depth}
                  className={placement.place}
                  onOpen={() => onOpen(index)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted mt-10 text-sm">The wall fills from the photographs already in the gallery.</p>
        )}
      </div>
    </section>
  );
}
