import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtWall } from '@/components/home/ArtWall';
import { CinematicReveal } from '@/components/home/CinematicReveal';
import { CinematicWide } from '@/components/home/CinematicWide';
import { ClosingFrame } from '@/components/home/ClosingFrame';
import { CoupleGallery } from '@/components/home/CoupleGallery';
import { CoupleStory } from '@/components/home/CoupleStory';
import { FloatingCollage } from '@/components/home/FloatingCollage';
import { HomeSlider } from '@/components/home/HomeSlider';
import { TreasureTrailer } from '@/components/home/TreasureTrailer';
import { PhotoLightbox } from '@/components/gallery/PhotoLightbox';
import { Band } from '@/components/ui/Band';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { useCurrentUser } from '@/features/auth/useAuth';
import { getHomeSections } from '@/services/admin.service';
import { getGallery } from '@/services/gallery.service';

const moments = [
  {
    title: 'Haldi',
    description: 'Marigold light, colour, and the morning before the vows.',
    href: '/gallery#haldi',
  },
  {
    title: 'Top featured',
    description: 'A short edit of the frames we want closest at hand.',
    href: '/gallery#featured',
  },
  {
    title: 'Albums',
    description: 'Ceremony, couple portraits, and every folder from Drive.',
    href: '/gallery#albums',
  },
];

const chapters = [
  {
    title: 'Haldi morning',
    description: 'Colour on the hands, family in the courtyard, and the day beginning in gold.',
    href: '/gallery#haldi',
  },
  {
    title: 'The two of them',
    description: 'A quieter hour for Rohit and Roshni, before the rooms fill.',
    href: '/gallery#albums',
  },
  {
    title: 'The ceremony',
    description: 'Vows, the people standing close, and the hour this house will keep replaying.',
    href: '/gallery#albums',
  },
  {
    title: 'What we kept',
    description: 'A few photographs pulled forward, so the day is easy to return to.',
    href: '/gallery#featured',
  },
];

function stills(items) {
  return (items || []).filter((item) => item?.previewPath && item.kind !== 'video');
}

function uniquePhotos(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function slidePhotos(gallery) {
  const pools = [gallery?.couple, gallery?.slider, gallery?.featured, gallery?.haldi?.photos];
  for (const pool of pools) {
    const images = stills(pool);
    if (images.length) return images;
  }
  return [];
}

function highlightPhotos(gallery) {
  const featured = stills(gallery?.featured);
  if (featured.length) return featured.slice(0, 6);
  return stills(gallery?.haldi?.photos).slice(0, 6);
}

const HERO_PORTRAITS = [
  { file: '4Q3A8413.JPG', alt: 'Roshni' },
  { file: '4Q3A8225.JPG', alt: 'Rohit' },
];

function heroPortraits(pool) {
  const chosen = HERO_PORTRAITS.map((portrait) => {
    const photo = pool.find((item) => item.name?.toLowerCase() === portrait.file.toLowerCase());
    return photo ? { ...photo, alt: portrait.alt } : null;
  }).filter(Boolean);
  if (chosen.length) return chosen;
  return pool.slice(0, 2).map((photo) => ({ ...photo, alt: photo.name || 'Rohit and Roshni' }));
}

const fallbackSections = [
  { key: 'hero', enabled: true, sortOrder: 0, eyebrow: 'Private collection', title: 'Rohit & Roshni', description: 'The wedding day, kept for the family. Scroll through the hours, then the photographs that stayed.' },
  { key: 'couple_story', enabled: true, sortOrder: 1, eyebrow: 'Together', title: 'Us.', description: 'Two people. One story. A thousand memories.' },
  { key: 'art_wall', enabled: true, sortOrder: 2, eyebrow: 'Exhibition', title: 'The memory wall', description: 'A private wall of the photographs we keep closest.' },
  { key: 'cinematic_reveal', enabled: true, sortOrder: 3, eyebrow: 'A quiet reveal', title: 'Together.', description: 'One frame, then the day gathers around it.' },
  { key: 'couple_gallery', enabled: true, sortOrder: 4, eyebrow: 'Art prints', title: 'In the gallery', description: 'A few photographs hung as prints, not as a grid.' },
  { key: 'floating_collage', enabled: true, sortOrder: 5, eyebrow: 'Depth', title: 'Around them', description: 'The portrait in the centre. The day resting nearby.' },
  { key: 'cinematic_wide', enabled: true, sortOrder: 6, eyebrow: 'Cinematic', title: 'The wide frame', description: 'A wide look at the two of them. A drone frame can take this place later.' },
  { key: 'slider', enabled: true, sortOrder: 7, eyebrow: 'From the day', title: 'A slow look through the frames', description: 'These photographs move on their own. Pause them by resting on the picture.' },
  { key: 'timeline', enabled: true, sortOrder: 8, eyebrow: 'The hours', title: 'How the day unfolded', description: 'Four chapters. Each one has a title, a short line, and a door into the photographs.' },
  { key: 'ways', enabled: true, sortOrder: 9, eyebrow: 'The day', title: 'Three ways in', description: 'Start with the haldi, the featured frames, or the full album list.' },
  { key: 'scattered', enabled: true, sortOrder: 10, eyebrow: 'In passing', title: 'Photographs the scroll finds', description: 'A small, unordered set from the day. They change each time you open the house.' },
  { key: 'highlights', enabled: true, sortOrder: 11, eyebrow: 'Highlighted', title: 'The frames we return to', description: 'A few photographs kept at the front of the collection.' },
  { key: 'closing', enabled: true, sortOrder: 12, eyebrow: 'The last look', title: 'Forever.', description: 'One photograph to leave with.' },
  { key: 'private', enabled: true, sortOrder: 13, eyebrow: 'For family', title: 'Signed in, kept private', description: 'Only people with an account can open the photographs. Nothing from the library is stored on this server.' },
];

const ORIGINAL_HOME_ORDER = ['hero', 'slider', 'timeline', 'ways', 'scattered', 'highlights', 'private'];

function mergeHomeSections(remote) {
  if (!Array.isArray(remote) || remote.length === 0) return fallbackSections;
  const keys = new Set(remote.map((section) => section.key));
  const missing = fallbackSections.filter((section) => !keys.has(section.key));
  if (!missing.length) return remote;
  const remoteKeys = remote.map((section) => section.key);
  const stillOriginal = remote.length === ORIGINAL_HOME_ORDER.length
    && ORIGINAL_HOME_ORDER.every((key, index) => remoteKeys[index] === key);
  if (stillOriginal) return fallbackSections;
  const maxOrder = remote.reduce((max, section) => Math.max(max, section.sortOrder ?? 0), 0);
  return [
    ...remote,
    ...missing.map((section, index) => ({ ...section, sortOrder: maxOrder + 1 + index })),
  ];
}

export function HomePage() {
  const { user } = useCurrentUser();
  const [gallery, setGallery] = useState(null);
  const [homeSections, setHomeSections] = useState(fallbackSections);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState({ photos: [], index: null });

  useEffect(() => {
    let active = true;
    getGallery()
      .then((data) => {
        if (active) setGallery(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'The home photographs could not be opened');
      });
    getHomeSections()
      .then((sections) => {
        if (active && Array.isArray(sections) && sections.length) setHomeSections(mergeHomeSections(sections));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const slides = slidePhotos(gallery);
  const highlights = highlightPhotos(gallery);
  const scattered = useMemo(() => {
    if (!gallery?.ready) return [];
    const pool = uniquePhotos([
      ...stills(gallery.slider),
      ...stills(gallery.featured),
      ...stills(gallery.haldi?.photos),
      ...stills((gallery.albums || []).map((album) => album.cover)),
    ]);
    return shuffle(pool).slice(0, 8);
  }, [gallery]);

  const exhibition = useMemo(() => {
    const couple = stills(gallery?.couple);
    const pool = couple.length ? couple : uniquePhotos([
      ...stills(gallery?.featured),
      ...stills(gallery?.slider),
      ...stills(gallery?.haldi?.photos),
      ...stills((gallery?.albums || []).map((album) => album.cover)),
    ]);
    const feature = pool.find((photo) => /drone|aerial|wide/i.test(photo.name || '')) || pool[0] || null;
    const beside = pool.filter((photo) => photo.id !== feature?.id);
    return { pool, feature, beside };
  }, [gallery]);

  const portraits = heroPortraits(exhibition.pool);

  function openViewer(photos, index) {
    const frames = photos.filter((photo) => photo?.previewPath);
    if (!frames.length) return;
    setViewer({ photos: frames, index });
  }

  const ordered = [...homeSections]
    .filter((section) => section.enabled !== false)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

  return (
    <div>
      {ordered.map((section) => {
        if (section.key === 'hero') {
          return (
      <div key="hero">
      <section className="hero-open bg-white">
        <div className="mx-auto grid w-full max-w-6xl items-end gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div>
            <p className="hero-line text-gold text-[11px] font-medium tracking-[0.32em] uppercase">
              {section.eyebrow || 'Private collection'}
            </p>
            <h1 className="hero-line hero-line-2 font-serif text-ink mt-4 max-w-3xl text-[clamp(2.6rem,8vw,4.6rem)] leading-[1.02] sm:text-7xl">
              {section.title}
            </h1>
            <p className="hero-line hero-line-3 text-muted mt-5 max-w-md text-base leading-relaxed sm:text-lg">
              {section.description}
            </p>
            <div className="hero-line hero-line-4 mt-8 flex flex-wrap items-center gap-5">
              <Link
                to="/gallery"
                className="bg-wine inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium text-white transition-opacity duration-500 ease-in-out hover:opacity-90"
              >
                Enter the gallery
              </Link>
              <a href="#memory-story" className="text-muted text-sm tracking-[0.14em] uppercase">
                Scroll to remember
              </a>
            </div>
          </div>
          {portraits.length ? (
            <div className="mx-auto grid w-full max-w-md grid-cols-2 items-start gap-3 sm:gap-4 lg:max-w-none">
              {portraits.map((photo, index) => (
                <figure
                  key={photo.id}
                  className={`photo-frame ${index === 1 ? 'mt-8 sm:mt-12' : ''}`}
                >
                  <img
                    src={photo.previewPath}
                    alt={photo.alt}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="aspect-[3/4] max-h-[70vh] w-full object-cover object-[center_28%] lg:max-h-[32rem]"
                  />
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <TreasureTrailer trailer={gallery?.trailer} />
      </div>
          );
        }

        if (section.key === 'slider') {
          return (
      <Band key="slider" tone="blush">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        {error ? (
          <p className="mb-6 max-w-xl rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {slides.length ? (
          <HomeSlider
            photos={slides}
            note={homeSections.find((item) => item.key === 'album_note')}
          />
        ) : (
          <p className="text-muted text-sm">
            {gallery && !gallery.ready
              ? gallery.message
              : 'The slider will fill from the Slider folder once those photographs are ready.'}
          </p>
        )}
      </Band>
          );
        }

        if (section.key === 'timeline') {
          return (
      <Band key="timeline" tone="white">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        <ol className="relative ml-3 border-l border-gold/40">
          {chapters.map((chapter, index) => (
            <li key={chapter.title} className="relative pb-10 pl-8 last:pb-0">
              <span className="bg-wine absolute top-2 left-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full" />
              <Reveal delay={index * 80}>
                <p className="text-gold text-[11px] font-medium tracking-[0.22em] uppercase">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="font-serif mt-2 text-2xl sm:text-3xl">{chapter.title}</h3>
                <p className="text-muted mt-2 max-w-md text-sm leading-relaxed">{chapter.description}</p>
                <Link to={chapter.href} className="text-wine mt-3 inline-block text-sm font-medium">
                  See this chapter
                </Link>
              </Reveal>
            </li>
          ))}
        </ol>
      </Band>
          );
        }

        if (section.key === 'ways') {
          return (
      <Band key="ways" tone="ivory">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((moment, index) => (
            <Reveal key={moment.title} delay={index * 90}>
              <Link
                to={moment.href}
                className="flex h-full flex-col rounded-3xl border border-white/80 bg-white p-6 transition hover:-translate-y-1"
              >
                <h3 className="font-serif text-2xl">{moment.title}</h3>
                <p className="text-muted mt-3 text-sm leading-relaxed">{moment.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Band>
          );
        }

        if (section.key === 'scattered') {
          return (
      <Band key="scattered" tone="blush">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        {scattered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {scattered.map((photo, index) => (
              <Reveal key={photo.id} delay={Math.min(index, 6) * 60} className={index % 5 === 0 ? 'sm:col-span-2' : ''}>
                <img
                  src={photo.previewPath}
                  alt={photo.name}
                  loading="lazy"
                  className={`w-full rounded-2xl object-cover ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Random frames appear here once the gallery has photographs.</p>
        )}
      </Band>
          );
        }

        if (section.key === 'highlights') {
          return (
      <Band key="highlights" tone="white">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        {highlights.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {highlights.map((photo, index) => (
              <Reveal key={photo.id} delay={Math.min(index, 5) * 50}>
                <Link to="/gallery#featured" className="photo-frame block">
                  <img
                    src={photo.previewPath}
                    alt={photo.name}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Highlighted photographs will appear from the Top Featured folder.</p>
        )}
        <Reveal>
          <Link to="/gallery#featured" className="text-wine mt-8 inline-block text-sm font-medium">
            Open every highlighted frame
          </Link>
        </Reveal>
      </Band>
          );
        }

        if (section.key === 'couple_story') {
          const frames = exhibition.pool.slice(0, 5);
          return (
            <CoupleStory
              key="couple_story"
              title={section.title}
              description={section.description}
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'art_wall') {
          const frames = exhibition.pool.slice(0, 7);
          return (
            <ArtWall
              key="art_wall"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'cinematic_reveal') {
          const frames = exhibition.pool.slice(0, 4);
          return (
            <CinematicReveal
              key="cinematic_reveal"
              title={section.title}
              description={section.description}
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'couple_gallery') {
          const frames = exhibition.pool.slice(0, 4);
          return (
            <CoupleGallery
              key="couple_gallery"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'floating_collage') {
          const frames = exhibition.pool.slice(0, 6);
          return (
            <FloatingCollage
              key="floating_collage"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'cinematic_wide') {
          const frames = [exhibition.feature, ...exhibition.beside.slice(0, 2)].filter(Boolean);
          return (
            <CinematicWide
              key="cinematic_wide"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              feature={exhibition.feature}
              photos={exhibition.beside}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'closing') {
          const photo = exhibition.pool[0] || null;
          return (
            <ClosingFrame
              key="closing"
              title={section.title}
              description={section.description}
              photo={photo}
              onOpen={() => openViewer(photo ? [photo] : [], 0)}
            />
          );
        }

        if (section.key === 'private') {
          return (
      <Band key="private" tone="ivory">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description={section.description}
        />
        <Reveal>
          <p className="max-w-xl rounded-2xl border border-gold/25 bg-blush px-5 py-4 text-sm leading-relaxed text-stone-800">
            You are signed in as {user?.name || 'a family member'}
            {user?.role ? ` · ${user.role}` : ''}. The slider, the timeline, and the frames above are for this house only.
          </p>
        </Reveal>
      </Band>
          );
        }

        return null;
      })}
      <PhotoLightbox
        photos={viewer.photos}
        index={viewer.index}
        onClose={() => setViewer((current) => ({ ...current, index: null }))}
        onIndex={(index) => setViewer((current) => ({ ...current, index }))}
      />
    </div>
  );
}
