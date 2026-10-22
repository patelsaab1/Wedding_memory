import { useEffect, useMemo, useRef, useState } from 'react';
import { WEDDING_JOURNEY } from '@/components/home/wedding-journey';

function stills(items) {
  return (items || []).filter((item) => item?.previewPath && item.kind !== 'video');
}

function albumCover(gallery, pattern) {
  if (!pattern) return null;
  const album = (gallery?.albums || []).find((item) =>
    pattern.test(`${item.title || ''} ${item.name || ''}`),
  );
  return album?.cover?.previewPath ? album.cover : null;
}

function asPhoto(source, fallback) {
  if (source?.previewPath) {
    return {
      id: source.id,
      name: source.name,
      alt: source.alt || source.name || fallback.alt,
      previewPath: source.previewPath,
      fullPath: source.fullPath || source.previewPath,
    };
  }
  return {
    id: fallback.src,
    name: fallback.alt,
    alt: fallback.alt,
    previewPath: fallback.src,
    fullPath: fallback.fallback || fallback.src,
    width: fallback.width,
    height: fallback.height,
  };
}

function chapterFrames(milestone, gallery) {
  const couple = stills(gallery?.couple);
  const haldi = stills(gallery?.haldi?.photos);
  const fromAlbum = albumCover(gallery, milestone.albumMatch);
  let main = fromAlbum;

  if (milestone.photoKey === 'haldi') {
    main = haldi[0] || fromAlbum;
  } else if (milestone.photoKey === 'wedding') {
    main = fromAlbum || couple[0];
  } else if (milestone.photoKey === 'sangeet') {
    main = fromAlbum || couple[2] || couple[0];
  } else if (milestone.photoKey === 'tel') {
    main = fromAlbum || couple[1] || couple[0];
  }

  const sidePool = milestone.photoKey === 'haldi' ? haldi[1] : couple[1];
  return {
    main: asPhoto(main, milestone.local),
    side: milestone.localSide ? asPhoto(sidePool, milestone.localSide) : null,
  };
}

/**
 * Cinematic wedding timeline for Rohit and Roshni.
 * @param {{ gallery?: object, onOpen: (photos: object[], index: number) => void }} props
 */
export function WeddingTimeline({ gallery, onOpen }) {
  const { eyebrow, title, description, milestones, finale } = WEDDING_JOURNEY;
  const trackRef = useRef(null);
  const [shown, setShown] = useState(() => milestones.map(() => false));
  const [active, setActive] = useState(0);
  const [vowShown, setVowShown] = useState(false);

  const chapters = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        frames: chapterFrames(milestone, gallery),
      })),
    [gallery, milestones],
  );

  useEffect(() => {
    const root = trackRef.current;
    if (!root) return undefined;
    const steps = [...root.querySelectorAll('[data-story-step]')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(milestones.map(() => true));
      setVowShown(true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setShown((current) => {
          const next = [...current];
          let changed = false;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = Number(entry.target.dataset.storyStep);
            if (!next[index]) {
              next[index] = true;
              changed = true;
            }
          }
          return changed ? next : current;
        });
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.dataset.storyStep));
      },
      { threshold: [0.28, 0.55], rootMargin: '-18% 0px -28% 0px' },
    );

    steps.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [milestones]);

  useEffect(() => {
    const node = trackRef.current?.querySelector('[data-story-vow]');
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVowShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVowShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.32 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fill = chapters.length ? (active + 1) / chapters.length : 0;

  return (
    <section id="home-timeline" className="our-story scroll-mt-20">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
        <header className="our-story__intro">
          <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">{eyebrow}</p>
          <h2 className="font-serif mt-3 text-[clamp(2.2rem,8vw,3.75rem)] leading-[1.08]">{title}</h2>
          <p className="salon-pair">
            Rohit <span aria-hidden="true">♥</span> Roshni
          </p>
          <p className="text-muted mt-4 max-w-xl text-sm leading-relaxed sm:text-base">{description}</p>
        </header>

        <div ref={trackRef} className="our-story__track">
          <div className="our-story__spine" aria-hidden="true">
            <div className="our-story__fill" style={{ transform: `scaleY(${fill})` }} />
          </div>

          {chapters.map((chapter, index) => {
            const photos = [chapter.frames.main, chapter.frames.side].filter(Boolean);
            const open = (photoIndex) => onOpen(photos, photoIndex);
            return (
              <article
                key={chapter.mark}
                data-story-step={index}
                className={`our-story__chapter ${shown[index] ? 'is-shown' : ''} ${active === index ? 'is-active' : ''} ${index % 2 ? 'is-flip' : ''} ${chapter.highlight ? 'is-highlight' : ''}`}
              >
                <span className="our-story__node" aria-hidden="true" />
                <figure className="our-story__media">
                  <button type="button" className="our-story__shot" onClick={() => open(0)}>
                    <img
                      className="our-story__photo"
                      src={chapter.frames.main.previewPath}
                      alt={chapter.frames.main.alt}
                      width={chapter.frames.main.width || 800}
                      height={chapter.frames.main.height || 1200}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                  {chapter.frames.side ? (
                    <button type="button" className="our-story__side" onClick={() => open(1)}>
                      <img
                        src={chapter.frames.side.previewPath}
                        alt={chapter.frames.side.alt}
                        width={chapter.frames.side.width || 480}
                        height={chapter.frames.side.height || 720}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ) : null}
                </figure>
                <div className="our-story__copy">
                  <p className="our-story__date">{chapter.date}</p>
                  <p className="our-story__subtitle">{chapter.subtitle}</p>
                  <h3 className="font-serif">{chapter.title}</h3>
                  <p className="our-story__body">{chapter.story}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div
        data-story-vow
        className={`our-story__vow ${vowShown ? 'is-shown' : ''}`}
      >
        <img
          className="our-story__vow-bg"
          src="/hero/together-1280.webp"
          alt=""
          width="1280"
          height="853"
          loading="lazy"
          decoding="async"
        />
        <div className="our-story__vow-veil" aria-hidden="true" />
        <div className="our-story__vow-copy">
          <p className="our-story__vow-names" aria-label="Rohit and Roshni">
            Rohit <span className="hero-heart" aria-hidden="true">♥</span> Roshni
          </p>
          <p className="our-story__vow-line">{finale.line}</p>
          <p className="our-story__vow-text">{finale.vow}</p>
          <p className="our-story__vow-close">{finale.close}</p>
        </div>
      </div>
    </section>
  );
}
