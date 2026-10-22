import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { useInView } from '@/components/gallery/useGalleryMotion';

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   photos: Array<{ id: string, name: string, previewPath: string }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function CinematicReveal({ id, title, description, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const frames = photos.slice(0, 4);
  const lead = frames[0];

  return (
    <section id={id} ref={ref} className={`wow-section scroll-mt-20 ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-32">
        <p className="text-[11px] font-medium tracking-[0.32em] text-white/55 uppercase">A quiet reveal</p>
        {lead ? (
          <div className="wow-stage">
            <ArtisticPhoto
              photo={lead}
              treatment="film"
              label="couple-main"
              depth={6}
              className="wow-lead"
              onOpen={() => onOpen(0)}
            />
            {frames.slice(1, 3).map((photo, index) => (
              <ArtisticPhoto
                key={photo.id}
                photo={photo}
                treatment={index === 0 ? 'frame' : 'fine'}
                label={index === 0 ? 'couple-portrait' : 'couple-art-01'}
                rotate={index === 0 ? -3 : 2.5}
                depth={14 + index * 6}
                className={`wow-side wow-side-${index}`}
                onOpen={() => onOpen(index + 1)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-white/70">A photograph will reveal itself here.</p>
        )}
        <div className="wow-copy">
          <h2 className="font-serif text-[clamp(2.2rem,9vw,4.5rem)] text-white sm:text-7xl">{title}</h2>
          {description ? <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{description}</p> : null}
        </div>
      </div>
    </section>
  );
}
