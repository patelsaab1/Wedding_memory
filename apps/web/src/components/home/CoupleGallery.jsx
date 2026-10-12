import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { useInView } from '@/components/gallery/useGalleryMotion';

const PRINTS = [
  { label: 'couple-portrait', treatment: 'editorial', place: 'print-main', caption: 'The laughter between moments.', rotate: -0.6 },
  { label: 'couple-candid', treatment: 'polaroid', place: 'print-polaroid', caption: 'That one perfect smile.', rotate: 4 },
  { label: 'couple-wide', treatment: 'film', place: 'print-film', caption: 'Before everyone arrived.', rotate: 0 },
  { label: 'couple-art-01', treatment: 'fine', place: 'print-fine', caption: 'The moments we did not plan.', rotate: -2 },
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
export function CoupleGallery({ eyebrow, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const frames = photos.slice(0, PRINTS.length);

  return (
    <section ref={ref} className={`couple-prints bg-surface ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">{eyebrow || 'Art prints'}</p>
        <h2 className="font-serif mt-3 text-4xl sm:text-6xl">{title}</h2>
        {description ? <p className="text-muted mt-4 max-w-md text-sm leading-relaxed">{description}</p> : null}
        {frames.length ? (
          <div className="print-gallery">
            {frames.map((photo, index) => {
              const print = PRINTS[index];
              return (
                <ArtisticPhoto
                  key={`${photo.id}-${print.place}`}
                  photo={photo}
                  treatment={print.treatment}
                  label={print.label}
                  caption={print.caption}
                  rotate={print.rotate}
                  depth={10 + index * 2}
                  className={print.place}
                  onOpen={() => onOpen(index)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted mt-10 text-sm">Prints appear from the couple photographs already saved.</p>
        )}
      </div>
    </section>
  );
}
