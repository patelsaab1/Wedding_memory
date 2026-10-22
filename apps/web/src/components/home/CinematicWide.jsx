import { useRef } from 'react';
import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';
import { HouseImg } from '@/components/gallery/useHouseSrc';
import { useInView } from '@/components/gallery/useGalleryMotion';

/**
 * Wide cinematic frame. `feature` can later be a drone still or film cover.
 * @param {{
 *   eyebrow?: string,
 *   title: string,
 *   description?: string,
 *   feature: { id: string, name: string, previewPath: string } | null,
 *   photos: Array<{ id: string, name: string, previewPath: string }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function CinematicWide({ id, eyebrow, title, description, feature, photos, onOpen }) {
  const ref = useRef(null);
  const shown = useInView(ref);
  const side = photos.slice(0, 2);

  return (
    <section id={id} ref={ref} className={`wide-section scroll-mt-20 ${shown ? 'is-shown' : ''}`}>
      <div className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6 sm:pt-28">
        <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">{eyebrow || 'Cinematic'}</p>
        <h2 className="font-serif mt-3 text-[clamp(2.2rem,9vw,3.75rem)]">{title}</h2>
      </div>
      {feature ? (
        <button type="button" className="wide-feature reveal-rise" data-label="couple-drone" onClick={() => onOpen(0)}>
          <HouseImg
            photo={feature}
            className="art-img"
          />
        </button>
      ) : (
        <p className="text-muted mx-auto mt-8 max-w-6xl px-4 text-sm">A wide photograph will open across this frame.</p>
      )}
      <div className="mx-auto grid w-full max-w-6xl items-end gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.2fr_1fr]">
        {side[0] ? (
          <ArtisticPhoto
            photo={side[0]}
            treatment="polaroid"
            label="couple-candid"
            rotate={-3}
            className="wide-side justify-self-center md:justify-self-start"
            onOpen={() => onOpen(1)}
          />
        ) : <span />}
        {description ? (
          <p className="font-serif text-center text-2xl leading-snug sm:text-3xl">{description}</p>
        ) : <span />}
        {side[1] ? (
          <ArtisticPhoto
            photo={side[1]}
            treatment="fine"
            label="couple-portrait"
            rotate={2}
            caption="Print"
            className="wide-side justify-self-center md:justify-self-end"
            onOpen={() => onOpen(2)}
          />
        ) : <span />}
      </div>
    </section>
  );
}
