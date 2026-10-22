import { Reveal } from '@/components/ui/Reveal';

/**
 * Full-width highlight for the Drive "video" folder.
 * @param {{ trailer?: { id?: string, title?: string, video?: { id: string, name: string, previewPath: string } | null } | null }} props
 */
export function TreasureTrailer({ trailer }) {
  const film = trailer?.video;
  if (!film?.previewPath) {
    return null;
  }

  return (
    <section id="treasure" className="scroll-mt-20 bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="text-[11px] font-medium tracking-[0.32em] text-white/60 uppercase">
            Wedding treasure
          </p>
          <h2 className="font-serif mt-4 max-w-3xl text-[clamp(2.2rem,9vw,3.75rem)] leading-tight">The trailer</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
            The film kept closest. Press play when you want the day back in one sitting.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <figure className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/15 bg-black">
            <video
              src={film.previewPath}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
              aria-label={film.name || 'Wedding treasure trailer'}
            />
            <figcaption className="px-4 py-3 text-[11px] tracking-[0.22em] text-white/60 uppercase sm:px-5">
              Intro film
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
