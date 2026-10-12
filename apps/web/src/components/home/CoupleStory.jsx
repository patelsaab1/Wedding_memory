import { useEffect, useRef, useState } from 'react';

const CHAPTERS = [
  { mark: '01', title: 'The beginning', line: 'Before everyone arrived.' },
  { mark: '02', title: 'The ceremony', line: 'Two souls. One beautiful beginning.' },
  { mark: '03', title: 'The celebration', line: 'The laughter between moments.' },
  { mark: '04', title: 'The people', line: 'That one perfect smile.' },
  { mark: '05', title: 'The little moments', line: 'The moments we did not plan.' },
];

/**
 * Sticky photograph on the left. Chapters on the right change the frame.
 * On small screens the photograph stays in normal flow.
 * @param {{
 *   title: string,
 *   description?: string,
 *   photos: Array<{ id: string, name: string, previewPath: string }>,
 *   onOpen: (index: number) => void,
 * }} props
 */
export function CoupleStory({ title, description, photos, onOpen }) {
  const frames = photos.slice(0, CHAPTERS.length);
  const chapters = CHAPTERS.slice(0, Math.max(frames.length, 0));
  const [active, setActive] = useState(0);
  const itemRefs = useRef([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        const next = Number(visible.target.getAttribute('data-index'));
        if (!Number.isNaN(next)) setActive(next);
      },
      { rootMargin: '-35% 0px -40% 0px', threshold: [0.35, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [frames.length]);

  const photo = frames[active] || frames[0];

  return (
    <section id="memory-story" className="story-section bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">Together</p>
          <h2 className="font-serif mt-4 text-5xl leading-none sm:text-7xl">{title}</h2>
          {description ? <p className="text-muted mt-5 max-w-sm text-sm leading-relaxed">{description}</p> : null}
          {photo ? (
            <button type="button" className="mt-8 block w-full text-left" onClick={() => onOpen(active)}>
              <img
                key={photo.id}
                src={photo.previewPath}
                alt={photo.name || 'Wedding photograph'}
                className="album-fade aspect-[4/5] max-h-[70vh] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ) : (
            <p className="text-muted mt-8 text-sm">Couple photographs will hang here once the gallery has frames.</p>
          )}
        </div>

        <ol className="flex flex-col">
          {chapters.map((chapter, index) => {
            const selected = index === active;
            return (
              <li
                key={chapter.mark}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-index={index}
                className="border-t border-stone-200 py-10 last:border-b"
              >
                <button type="button" className="w-full text-left" onClick={() => setActive(index)}>
                  <p className={`text-[11px] tracking-[0.28em] uppercase ${selected ? 'text-wine' : 'text-gold'}`}>
                    {chapter.mark}
                  </p>
                  <h3 className={`font-serif mt-3 text-3xl sm:text-4xl ${selected ? 'text-ink' : 'text-stone-400'}`}>
                    {chapter.title}
                  </h3>
                  <p className="text-muted mt-3 max-w-sm text-sm leading-relaxed">{chapter.line}</p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
