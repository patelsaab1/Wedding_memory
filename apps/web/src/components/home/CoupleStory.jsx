import { useEffect, useRef, useState } from 'react';
import { HouseImg } from '@/components/gallery/useHouseSrc';
import { COUPLE_STORY } from '@/components/home/couple-story';

/**
 * Sticky portrait on the left. Chapters on the right change the frame.
 * @param {{
 *   id?: string,
 *   photos: Array<{
 *     id: string,
 *     mark?: string,
 *     kicker?: string,
 *     title?: string,
 *     line?: string,
 *     whisper?: string,
 *     alt?: string,
 *     name?: string,
 *     previewPath: string,
 *     position?: string,
 *     width?: number,
 *     height?: number,
 *   }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function CoupleStory({ id = 'home-couple_story', photos, onOpen }) {
  const chapters = photos.length ? photos : COUPLE_STORY.chapters;
  const [active, setActive] = useState(0);
  const itemRefs = useRef([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        const next = Number(visible.target.getAttribute('data-index'));
        if (!Number.isNaN(next)) setActive(next);
      },
      { rootMargin: '-32% 0px -38% 0px', threshold: [0.35, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [chapters.length]);

  const photo = chapters[active] || chapters[0];

  return (
    <section id={id} className="story-section us-story scroll-mt-20">
      <div className="us-story__grid">
        <div className="us-story__stage">
          <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">{COUPLE_STORY.eyebrow}</p>
          <h2 className="font-serif mt-4 text-[clamp(2.6rem,10vw,4.6rem)] leading-none">{COUPLE_STORY.title}</h2>
          <p className="salon-pair">
            Rohit <span aria-hidden="true">♥</span> Roshni
          </p>
          <p className="text-muted mt-4 max-w-sm text-sm leading-relaxed">{COUPLE_STORY.description}</p>

          {photo?.previewPath ? (
            <figure className="us-story__frame">
              <button type="button" className="us-story__shot" onClick={() => onOpen(active)}>
                <HouseImg
                  key={photo.id}
                  photo={photo}
                  loading={active === 0 ? 'eager' : 'lazy'}
                  className="us-story__photo album-fade"
                  style={{ objectPosition: photo.position || 'center 18%' }}
                />
              </button>
              <figcaption className="us-story__caption">
                <span>{photo.kicker}</span>
                <span aria-hidden="true">·</span>
                <span>{photo.title}</span>
              </figcaption>
            </figure>
          ) : (
            <p className="text-muted mt-8 text-sm">Couple photographs will hang here once the gallery has frames.</p>
          )}
        </div>

        <ol className="us-story__chapters">
          {chapters.map((chapter, index) => {
            const selected = index === active;
            return (
              <li
                key={chapter.id || chapter.mark}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-index={index}
                className={`us-story__chapter ${selected ? 'is-active' : ''}`}
              >
                <button type="button" className="us-story__btn" onClick={() => setActive(index)}>
                  <p className="us-story__mark">{chapter.mark}</p>
                  <p className="us-story__kicker">{chapter.kicker}</p>
                  <h3 className="font-serif">{chapter.title}</h3>
                  <p className="us-story__line">{chapter.line}</p>
                  {chapter.whisper ? <p className="us-story__whisper">{chapter.whisper}</p> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
