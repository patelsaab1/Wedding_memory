import { forwardRef, memo, useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { PhotoLightbox } from '@/components/gallery/PhotoLightbox';
import { HouseImg } from '@/components/gallery/useHouseSrc';

const STORY_MS = 4500;

const NoteSheet = forwardRef(function NoteSheet({ eyebrow, title, line }, ref) {
  return (
    <article ref={ref} className="album-sheet album-note" data-density="hard">
      <div className="album-note-copy">
        {eyebrow ? <p className="album-note-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="album-note-title">{title}</h2> : null}
        {line ? <p className="album-note-line">{line}</p> : null}
      </div>
    </article>
  );
});

function sameAlbum(previous, next) {
  if (previous.showNote !== next.showNote || previous.reduced !== next.reduced) return false;
  const before = previous.inscription || {};
  const after = next.inscription || {};
  if (before.eyebrow !== after.eyebrow || before.title !== after.title || before.line !== after.line) return false;
  if (previous.photos.length !== next.photos.length) return false;
  return previous.photos.every((photo, index) => (
    photo.id === next.photos[index]?.id && photo.previewPath === next.photos[index]?.previewPath
  ));
}

const AlbumBook = memo(function AlbumBook({ bookRef, photos, showNote, inscription, reduced, onOpen, onFlip }) {
  const last = photos.length - 1;

  return (
    <HTMLFlipBook
      ref={bookRef}
      className="wedding-album"
      width={480}
      height={640}
      size="stretch"
      minWidth={260}
      maxWidth={520}
      minHeight={360}
      maxHeight={720}
      drawShadow={!reduced}
      flippingTime={reduced ? 1 : 850}
      usePortrait
      autoSize
      maxShadowOpacity={0.35}
      showCover
      mobileScrollSupport
      swipeDistance={30}
      clickEventForward
      useMouseEvents
      showPageCorners={!reduced}
      disableFlipByClick
      startZIndex={2}
      onFlip={onFlip}
      renderOnlyPageLengthChange
    >
      {[
        showNote ? (
          <NoteSheet
            key="album-note"
            eyebrow={inscription.eyebrow}
            title={inscription.title}
            line={inscription.line}
          />
        ) : null,
        ...photos.map((photo, photoIndex) => (
          <AlbumSheet
            key={photo.id}
            photo={photo}
            eager={photoIndex < 2}
            hard={(!showNote && photoIndex === 0) || photoIndex === last}
            onOpen={() => onOpen(photoIndex)}
          />
        )),
      ].filter(Boolean)}
    </HTMLFlipBook>
  );
}, sameAlbum);

const AlbumSheet = forwardRef(function AlbumSheet({ photo, eager, hard, onOpen }, ref) {
  return (
    <article ref={ref} className="album-sheet" data-density={hard ? 'hard' : 'soft'}>
      <HouseImg
        photo={photo}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        className="h-full w-full object-cover"
      />
      <button
        type="button"
        className="album-open"
        aria-label={`View ${photo.name || 'photograph'}`}
        onClick={onOpen}
      >
        View
      </button>
    </article>
  );
});

/**
 * Interactive wedding album. Pages turn with StPageFlip.
 * Story mode waits until Play is pressed, then pauses off-screen or on a manual turn.
 * @param {{
 *   photos: Array<{ id: string, name: string, previewPath: string, fullPath?: string }>,
 *   note?: { enabled?: boolean, eyebrow?: string, title?: string, description?: string } | null,
 * }} props
 */
export function HomeSlider({ photos, note = null }) {
  const rootRef = useRef(null);
  const bookRef = useRef(null);
  const autoLock = useRef(false);
  const [index, setIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [reduced] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  const inscription = note && note.enabled !== false ? {
    eyebrow: String(note.eyebrow || '').trim(),
    title: String(note.title || '').trim(),
    line: String(note.description || '').trim(),
  } : null;
  const showNote = Boolean(inscription && (inscription.eyebrow || inscription.title || inscription.line));
  const count = photos.length;
  const pages = count + (showNote ? 1 : 0);

  useEffect(() => {
    setIndex(0);
    setOpenIndex(null);
    setPlaying(false);
  }, [count, showNote]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen) setPlaying(false);
  }, [onScreen]);

  const openPhoto = useCallback((photoIndex) => {
    setPlaying(false);
    setOpenIndex(photoIndex);
  }, []);

  const onFlip = useCallback((event) => {
    const next = typeof event?.data === 'number' ? event.data : 0;
    setIndex(next);
    if (autoLock.current) {
      autoLock.current = false;
      return;
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || !onScreen || pages < 2 || reduced) return undefined;
    const timer = window.setInterval(() => {
      const flip = bookRef.current?.pageFlip?.();
      if (!flip) return;
      autoLock.current = true;
      const current = flip.getCurrentPageIndex();
      if (current >= flip.getPageCount() - 1) flip.turnToPage(0);
      else flip.flipNext();
    }, STORY_MS);
    return () => window.clearInterval(timer);
  }, [playing, onScreen, pages, reduced, index]);

  if (!count) return null;

  function turn(direction) {
    setPlaying(false);
    const flip = bookRef.current?.pageFlip?.();
    if (!flip) return;
    if (direction > 0) flip.flipNext();
    else flip.flipPrev();
  }

  function onKey(event) {
    if (openIndex !== null) return;
    if (event.key === 'ArrowRight') turn(1);
    if (event.key === 'ArrowLeft') turn(-1);
  }

  return (
    <div
      ref={rootRef}
      className="outline-none focus-visible:ring-2 focus-visible:ring-wine/70"
      tabIndex={0}
      role="region"
      aria-label="Wedding album"
      onKeyDown={onKey}
    >
      <div className="mx-auto flex w-full max-w-[520px] justify-center overflow-x-clip">
        <AlbumBook
          bookRef={bookRef}
          photos={photos}
          showNote={showNote}
          inscription={inscription}
          reduced={reduced}
          onOpen={openPhoto}
          onFlip={onFlip}
        />
      </div>
      <p className="text-muted mt-4 text-center text-xs tracking-[0.18em] uppercase">
        <span className="sm:hidden">Swipe to turn · View opens the photograph</span>
        <span className="hidden sm:inline">Turn from the corner · View opens the photograph</span>
      </p>
      <div className="bg-blush mt-4 h-0.5 overflow-hidden">
        <div
          key={playing ? `${photos[index]?.id}-play` : `still-${index}`}
          className={`bg-wine h-full origin-left ${playing ? 'album-play' : ''}`}
          style={playing ? undefined : { width: `${((index + 1) / pages) * 100}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-xs tracking-[0.22em] uppercase">
          {String(index + 1).padStart(2, '0')} / {String(pages).padStart(2, '0')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => turn(-1)} className="min-h-11 rounded-full border border-stone-300 px-4 text-sm">
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            disabled={pages < 2 || reduced}
            className="min-h-11 rounded-full border border-stone-300 px-4 text-sm disabled:opacity-40"
          >
            {playing ? 'Pause story' : 'Play story'}
          </button>
          <button type="button" onClick={() => turn(1)} className="bg-ink min-h-11 rounded-full px-4 text-sm text-white">
            Next
          </button>
        </div>
      </div>
      <PhotoLightbox
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndex={setOpenIndex}
      />
    </div>
  );
}
