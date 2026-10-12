import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Band } from '@/components/ui/Band';
import { FloatingOrbs } from '@/components/ui/FloatingOrbs';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { GalleryMedia, PhotoGrid } from '@/components/gallery/PhotoGrid';
import { TreasureTrailer } from '@/components/home/TreasureTrailer';
import { getGallery } from '@/services/gallery.service';

export function GalleryPage() {
  const [gallery, setGallery] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getGallery()
      .then((data) => {
        if (active) setGallery(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Gallery could not be loaded');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const coupleName = gallery?.coupleName || 'Rohit & Roshni';

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200/70 bg-white">
        <FloatingOrbs />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">Gallery</p>
            <h1 className="font-serif text-ink mt-3 text-4xl sm:text-6xl">{coupleName}</h1>
            <p className="text-muted mt-4 max-w-xl text-base leading-relaxed">
              Haldi, featured frames, and the albums saved in the Photos folder.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              <a href="#treasure" className="rounded-full border border-stone-300 px-4 py-2">
                Trailer
              </a>
              <a href="#featured" className="rounded-full border border-stone-300 px-4 py-2">
                Featured
              </a>
              <a href="#haldi" className="rounded-full border border-stone-300 px-4 py-2">
                Haldi
              </a>
              <a href="#albums" className="rounded-full border border-stone-300 px-4 py-2">
                Albums
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <TreasureTrailer trailer={gallery?.trailer} />

      {loading ? (
        <Band tone="ivory">
          <p className="text-muted text-sm">Opening the photo folders…</p>
        </Band>
      ) : null}

      {error ? (
        <Band tone="blush">
          <p className="max-w-2xl rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        </Band>
      ) : null}

      {gallery && !gallery.ready ? (
        <Band tone="blush">
          <SectionIntro
            eyebrow="Drive"
            title="Photos are almost here"
            description={gallery.message}
          />
        </Band>
      ) : null}

      {gallery?.slider?.length ? (
        <section className="bg-blush py-8 sm:py-12">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="flex snap-x gap-3 overflow-x-auto pb-2 sm:gap-4">
              {gallery.slider.map((photo) => (
                <GalleryMedia
                  key={photo.id}
                  item={photo}
                  layout="strip"
                  className="w-[82%] shrink-0 snap-center sm:w-[48%]"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Band id="featured" tone="white">
        <SectionIntro
          eyebrow="Selected"
          title="Top featured"
          description="A small set of photographs pulled from the Top Featured folder."
        />
        {gallery?.featured?.length ? (
          <PhotoGrid photos={gallery.featured} />
        ) : (
          <p className="text-muted text-sm">Featured photos will appear when that folder has images.</p>
        )}
      </Band>

      <Band id="haldi" tone="blush">
        <SectionIntro
          eyebrow="Event"
          title="Haldi"
          description="Colour, family, and the ceremony morning."
        />
        {gallery?.haldi?.photos?.length ? (
          <>
            <PhotoGrid photos={gallery.haldi.photos} />
            {gallery.haldi.id ? (
              <Reveal>
                <Link to={`/gallery/${gallery.haldi.id}`} className="text-wine mt-8 inline-block text-sm font-medium">
                  View all Haldi photos
                </Link>
              </Reveal>
            ) : null}
          </>
        ) : (
          <p className="text-muted text-sm">Haldi photos will appear from the Haldi folder.</p>
        )}
      </Band>

      <Band id="albums" tone="ivory">
        <SectionIntro
          eyebrow="Albums"
          title="The rest of the day"
          description="Every other folder in Photos, from portraits to the ceremony."
        />
        {gallery?.albums?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.albums.map((album, index) => (
              <Reveal key={album.id} delay={index * 70}>
                <Link
                  to={`/gallery/${album.id}`}
                  className="group block overflow-hidden rounded-3xl border border-stone-200/80 bg-white"
                >
                  {album.cover ? (
                    <img
                      src={album.cover.previewPath}
                      alt=""
                      className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="font-serif flex aspect-[4/3] items-center justify-center bg-white text-4xl text-stone-300">
                      {album.title.slice(0, 1)}
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <h3 className="font-serif text-2xl">{album.title}</h3>
                    <p className="text-muted mt-1 text-sm">Open this album</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Albums will list here once Drive returns the other folders.</p>
        )}
      </Band>
    </div>
  );
}
