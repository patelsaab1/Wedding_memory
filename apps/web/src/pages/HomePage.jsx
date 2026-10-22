import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArtWall } from '@/components/home/ArtWall';
import { CinematicReveal } from '@/components/home/CinematicReveal';
import { CinematicWide } from '@/components/home/CinematicWide';
import { ClosingFrame } from '@/components/home/ClosingFrame';
import { CoupleGallery } from '@/components/home/CoupleGallery';
import { CoupleStory } from '@/components/home/CoupleStory';
import { FloatingCollage } from '@/components/home/FloatingCollage';
import { HomeSlider } from '@/components/home/HomeSlider';
import { TreasureTrailer } from '@/components/home/TreasureTrailer';
import { WeddingHero } from '@/components/home/WeddingHero';
import { AROUND_THEM } from '@/components/home/around-them';
import { COUPLE_STORY } from '@/components/home/couple-story';
import {
  CLOSING_FRAME,
  HIGHLIGHT_FRAMES,
  PRINT_FRAMES,
  SCATTERED_FRAMES,
  TOGETHER_FRAMES,
  WIDE_FRAMES,
} from '@/components/home/leftover-photos';
import { MEMORY_WALL } from '@/components/home/memory-wall';
import { WeddingTimeline } from '@/components/home/WeddingTimeline';
import { WEDDING_JOURNEY } from '@/components/home/wedding-journey';
import { PhotoLightbox } from '@/components/gallery/PhotoLightbox';
import { Band } from '@/components/ui/Band';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { useCurrentUser } from '@/features/auth/useAuth';
import { houseFallbackPhotos, withLocalFallback } from '@/components/home/local-photos';
import { getHomeSections } from '@/services/admin.service';
import { getGallery } from '@/services/gallery.service';
import { isSuperAdmin } from '@wedding-memory/shared';
import { HouseImg } from '@/components/gallery/useHouseSrc';

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

function slidePhotos(gallery) {
  const pools = [gallery?.couple, gallery?.slider, gallery?.featured, gallery?.haldi?.photos];
  for (const pool of pools) {
    const images = stills(pool);
    if (images.length) return images;
  }
  return [];
}

function photosNamed(pool, files) {
  const chosen = files
    .map((file) => pool.find((item) => item.name?.toLowerCase() === file.toLowerCase()))
    .filter(Boolean);
  if (chosen.length) return chosen;
  return pool.slice(0, files.length);
}

function numberedPhotos(pool) {
  return pool
    .map((photo) => {
      const match = String(photo.name || '').trim().match(/^(\d{1,2})[-_.\s]/);
      return match ? { photo, order: Number(match[1]) } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order)
    .map((item) => item.photo);
}

function curatedPhotos(set, pool) {
  return set.map((piece) => {
    const localPath = piece.previewPath;
    const localFull = piece.fullPath || piece.previewPath;
    const fromDrive = pool.find((item) => item.name?.toLowerCase() === piece.file.toLowerCase());
    if (fromDrive?.previewPath) {
      return {
        ...piece,
        id: fromDrive.id,
        previewPath: fromDrive.previewPath,
        fullPath: fromDrive.fullPath || fromDrive.previewPath,
        localPath,
        localFull,
      };
    }
    return { ...piece, localPath, localFull };
  });
}

function memoryWallPhotos(pool) {
  return curatedPhotos(MEMORY_WALL, pool);
}

function explorePhotos(photos) {
  const numbered = numberedPhotos(photos);
  const lead = numbered.length >= 2
    ? numbered.slice(0, 8)
    : photosNamed(photos, ['4Q3A8413.JPG', '4Q3A8225.JPG', '4Q3A8407.JPG', '4Q3A8224.JPG']);
  const rest = photos.filter((photo) => !lead.some((item) => item.id === photo.id));
  return [...lead, ...rest];
}

const fallbackSections = [
  { key: 'hero', enabled: true, sortOrder: 0, eyebrow: 'Private collection', title: 'Rohit & Roshni', description: 'The wedding day, kept for the family. Scroll through the hours, then the photographs that stayed.' },
  { key: 'couple_story', enabled: true, sortOrder: 1, eyebrow: COUPLE_STORY.eyebrow, title: COUPLE_STORY.title, description: COUPLE_STORY.description },
  { key: 'art_wall', enabled: true, sortOrder: 2, eyebrow: 'Private salon', title: 'The memory wall', description: 'Roshni’s portraits, Rohit beside her, and the frames this house keeps closest. Hung the way a gallery hangs the work it loves.' },
  { key: 'cinematic_reveal', enabled: true, sortOrder: 3, eyebrow: 'A quiet reveal', title: 'Together.', description: 'One frame, then the day gathers around it.' },
  { key: 'couple_gallery', enabled: true, sortOrder: 4, eyebrow: 'Art prints', title: 'In the gallery', description: 'A few photographs hung as prints, not as a grid.' },
  { key: 'floating_collage', enabled: true, sortOrder: 5, eyebrow: 'Close by', title: 'Around them', description: 'Roshni at the centre. Rohit close. The hours of the day resting nearby.' },
  { key: 'cinematic_wide', enabled: true, sortOrder: 6, eyebrow: 'Cinematic', title: 'The wide frame', description: 'A wide look at the two of them. A drone frame can take this place later.' },
  { key: 'slider', enabled: true, sortOrder: 7, eyebrow: 'From the day', title: 'A slow look through the frames', description: 'These photographs move on their own. Pause them by resting on the picture.' },
  { key: 'timeline', enabled: true, sortOrder: 8, eyebrow: WEDDING_JOURNEY.eyebrow, title: WEDDING_JOURNEY.title, description: WEDDING_JOURNEY.description },
  { key: 'ways', enabled: true, sortOrder: 9, eyebrow: 'The day', title: 'Three ways in', description: 'Start with the haldi, the featured frames, or the full album list.' },
  { key: 'scattered', enabled: true, sortOrder: 10, eyebrow: 'In passing', title: 'Photographs the scroll finds', description: 'A small set of the two of them, hung the way the rest of the house is hung.' },
  { key: 'highlights', enabled: true, sortOrder: 11, eyebrow: 'Highlighted', title: 'The frames we return to', description: 'A few photographs of Rohit and Roshni kept at the front of the collection.' },
  { key: 'closing', enabled: true, sortOrder: 12, eyebrow: 'The last look', title: 'Forever.', description: 'One photograph to leave with.' },
  { key: 'private', enabled: true, sortOrder: 13, eyebrow: 'Email and password', title: 'This house stays private', description: 'The photographs open with the email and password given to you. Super admin holds the master login the same way — not through Google.' },
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
  const { hash } = useLocation();
  const [gallery, setGallery] = useState(null);
  const [homeSections, setHomeSections] = useState(fallbackSections);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState({ photos: [], index: null });
  const [sectionsSettled, setSectionsSettled] = useState(false);

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
      .catch(() => {})
      .finally(() => {
        if (active) setSectionsSettled(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = String(hash || '').replace(/^#/, '');
    if (!id) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [hash, sectionsSettled, gallery]);

  const slides = useMemo(() => slidePhotos(gallery), [gallery]);
  const bookPhotos = useMemo(() => {
    const fromDrive = withLocalFallback(explorePhotos(slides));
    if (fromDrive.length) return fromDrive;
    if (gallery !== null || error) return houseFallbackPhotos();
    return [];
  }, [slides, gallery, error]);
  const albumNote = homeSections.find((item) => item.key === 'album_note');
  const houseStills = useMemo(() => uniquePhotos([
    ...stills(gallery?.couple),
    ...stills(gallery?.featured),
    ...stills(gallery?.slider),
    ...stills(gallery?.haldi?.photos),
    ...stills((gallery?.albums || []).map((album) => album.cover)),
  ]), [gallery]);
  const scattered = useMemo(() => curatedPhotos(SCATTERED_FRAMES, houseStills), [houseStills]);
  const highlights = useMemo(() => curatedPhotos(HIGHLIGHT_FRAMES, houseStills), [houseStills]);
  const togetherFrames = useMemo(() => curatedPhotos(TOGETHER_FRAMES, houseStills), [houseStills]);
  const printFrames = useMemo(() => curatedPhotos(PRINT_FRAMES, houseStills), [houseStills]);
  const wideFrames = useMemo(() => curatedPhotos(WIDE_FRAMES, houseStills), [houseStills]);
  const closingPhoto = useMemo(() => curatedPhotos([CLOSING_FRAME], houseStills)[0] || null, [houseStills]);

  const exhibition = useMemo(() => {
    const couple = stills(gallery?.couple);
    const pool = couple.length ? couple : houseStills;
    return { pool };
  }, [gallery, houseStills]);

  function openViewer(photos, index) {
    const frames = photos.filter((photo) => photo?.previewPath);
    if (!frames.length) return;
    setViewer({ photos: frames, index });
  }

  const ordered = [...homeSections]
    .filter((section) => section.enabled !== false && section.key !== 'album_note')
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

  return (
    <div>
      {ordered.map((section) => {
        if (section.key === 'hero') {
          return (
      <div key="hero">
      <WeddingHero eyebrow={section.eyebrow} description={section.description} />
      <TreasureTrailer trailer={gallery?.trailer} />
      </div>
          );
        }

        if (section.key === 'slider') {
          return (
      <Band id="home-slider" key="slider" tone="blush">
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
        {sectionsSettled && bookPhotos.length ? (
          <HomeSlider
            key={bookPhotos.map((photo) => photo.id).join('-')}
            photos={bookPhotos}
            note={albumNote}
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
          return <WeddingTimeline key="timeline" gallery={gallery} onOpen={openViewer} />;
        }

        if (section.key === 'ways') {
          return (
      <Band id="home-ways" key="ways" tone="ivory">
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
      <Band id="home-scattered" key="scattered" tone="blush">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description="A small set of the two of them, hung the way the rest of the house is hung."
        />
        {scattered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {scattered.map((photo, index) => (
              <Reveal key={photo.id} delay={Math.min(index, 6) * 60} className={index % 5 === 0 ? 'sm:col-span-2' : ''}>
                <button type="button" className="block w-full cursor-pointer border-0 bg-transparent p-0" onClick={() => openViewer(scattered, index)}>
                  <HouseImg
                    photo={photo}
                    className={`w-full rounded-2xl object-cover ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
                  />
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">A few frames of the two of them will rest here.</p>
        )}
      </Band>
          );
        }

        if (section.key === 'highlights') {
          return (
      <Band id="home-highlights" key="highlights" tone="white">
        <SectionIntro
          eyebrow={section.eyebrow}
          title={section.title}
          description="A few photographs of Rohit and Roshni kept at the front of the collection."
        />
        {highlights.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {highlights.map((photo, index) => (
              <Reveal key={photo.id} delay={Math.min(index, 5) * 50}>
                <Link to="/gallery#featured" className="photo-frame block">
                  <HouseImg photo={photo} className="aspect-[4/5] w-full object-cover" />
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Highlighted photographs of Rohit and Roshni will rest here.</p>
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
          const frames = curatedPhotos(COUPLE_STORY.chapters, exhibition.pool);
          return (
            <CoupleStory
              key="couple_story"
              id="home-couple_story"
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'art_wall') {
          const frames = memoryWallPhotos(exhibition.pool);
          return (
            <ArtWall
              key="art_wall"
              id="home-art_wall"
              eyebrow="Private salon"
              title="The memory wall"
              description="Roshni’s portraits, Rohit beside her, and the frames this house keeps closest."
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'cinematic_reveal') {
          return (
            <CinematicReveal
              key="cinematic_reveal"
              id="home-cinematic_reveal"
              title={section.title}
              description={section.description}
              photos={togetherFrames}
              onOpen={(index) => openViewer(togetherFrames, index)}
            />
          );
        }

        if (section.key === 'couple_gallery') {
          return (
            <CoupleGallery
              key="couple_gallery"
              id="home-couple_gallery"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              photos={printFrames}
              onOpen={(index) => openViewer(printFrames, index)}
            />
          );
        }

        if (section.key === 'floating_collage') {
          const frames = curatedPhotos(AROUND_THEM, exhibition.pool);
          return (
            <FloatingCollage
              key="floating_collage"
              id="home-floating_collage"
              eyebrow="Close by"
              title="Around them"
              description="Roshni at the centre. Rohit close. The hours of the day resting nearby."
              photos={frames}
              onOpen={(index) => openViewer(frames, index)}
            />
          );
        }

        if (section.key === 'cinematic_wide') {
          const feature = wideFrames[0] || null;
          const beside = wideFrames.slice(1, 3);
          return (
            <CinematicWide
              key="cinematic_wide"
              id="home-cinematic_wide"
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              feature={feature}
              photos={beside}
              onOpen={(index) => openViewer(wideFrames, index)}
            />
          );
        }

        if (section.key === 'closing') {
          return (
            <ClosingFrame
              key="closing"
              id="home-closing"
              title={section.title}
              description={section.description}
              photo={closingPhoto}
              onOpen={() => openViewer(closingPhoto ? [closingPhoto] : [], 0)}
            />
          );
        }

        if (section.key === 'private') {
          const master = isSuperAdmin(user);
          return (
      <Band id="home-private" key="private" tone="ivory">
        <SectionIntro
          eyebrow="Email and password"
          title={master ? 'Master login' : 'This house stays private'}
          description={
            master
              ? 'The master panel opens with this same email and password. The site does not use Google sign-in.'
              : 'The photographs open with the email and password given to you. Super admin holds the master login the same way — not through Google.'
          }
        />
        <Reveal>
          <p className="max-w-xl rounded-2xl border border-gold/25 bg-blush px-5 py-4 text-sm leading-relaxed text-stone-800">
            {master ? (
              <>
                You are signed in as <span className="font-medium">{user?.email}</span>.
                {' '}This email and password are the master key. Keep the password private; it is never shown here.
              </>
            ) : (
              <>
                You are signed in as <span className="font-medium">{user?.email || user?.name || 'a family member'}</span>
                {user?.role ? ` · ${user.role}` : ''}.
                {' '}This house opens with email and password only.
              </>
            )}
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
