import { ArtisticPhoto } from '@/components/gallery/ArtisticPhoto';

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   photo: { id: string, name: string, previewPath: string } | null,
 *   onOpen: () => void,
 * }} props
 */
export function ClosingFrame({ title, description, photo, onOpen }) {
  return (
    <section className="bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">The last look</p>
        <h2 className="font-serif mt-4 text-5xl sm:text-7xl">{title}</h2>
        {description ? <p className="text-muted mt-4 max-w-sm text-sm leading-relaxed">{description}</p> : null}
        {photo ? (
          <ArtisticPhoto
            photo={photo}
            treatment="frame"
            label="couple-main"
            className="forever-float mt-12 w-full max-w-md"
            onOpen={onOpen}
          />
        ) : null}
      </div>
    </section>
  );
}
