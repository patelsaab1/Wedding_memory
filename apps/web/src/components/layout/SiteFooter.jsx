import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSuperAdmin } from '@wedding-memory/shared';
import { useAuth } from '@/features/auth/useAuth';
import { HouseImg } from '@/components/gallery/useHouseSrc';
import { houseFallbackPhotos } from '@/components/home/local-photos';
import { getGallery } from '@/services/gallery.service';

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/status', label: 'Status' },
];

function lastStill(gallery) {
  const pools = [
    gallery?.featured,
    gallery?.slider,
    gallery?.haldi?.photos,
    (gallery?.albums || []).map((album) => album.cover),
  ];
  const photos = pools.flat().filter((item) => item?.previewPath && item.kind !== 'video');
  return photos.at(-1) || null;
}

export function SiteFooter() {
  const { user } = useAuth();
  const showAdmin = isSuperAdmin(user);
  const [photo, setPhoto] = useState(() => houseFallbackPhotos()[0] || null);

  useEffect(() => {
    let active = true;
    getGallery()
      .then((gallery) => {
        if (active) setPhoto(lastStill(gallery) || houseFallbackPhotos()[0] || null);
      })
      .catch(() => {
        if (active) setPhoto(houseFallbackPhotos()[0] || null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer>
      <div className="overflow-hidden bg-blush px-4 py-16 text-center sm:py-20">
        <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">Forever</p>
        <p className="font-serif text-ink mt-3 text-4xl sm:text-5xl">Rohit & Roshni</p>
        {photo ? (
          <figure className="forever-float mx-auto mt-10 w-44 sm:w-56">
            <HouseImg
              photo={photo}
              className="aspect-[3/4] w-full rounded-[1.6rem] object-cover shadow-[0_18px_40px_rgba(122,48,64,0.18)]"
            />
          </figure>
        ) : null}
        <p className="text-muted mx-auto mt-8 max-w-xs text-sm leading-relaxed">
          The last photograph, kept in motion.
        </p>
      </div>

      <div className="border-t border-stone-200/80 bg-ink text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-white/60 uppercase">
              Private collection
            </p>
            <p className="font-serif mt-3 text-3xl sm:text-4xl">Rohit & Roshni</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              A family library. Photographs and films stay in Drive. This site only opens them
              for people who are signed in.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-[11px] font-medium tracking-[0.28em] text-white/60 uppercase">Visit</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="inline-flex min-h-11 items-center text-sm text-white/85 transition-colors duration-500 ease-in-out hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4">
          {showAdmin ? (
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-center text-xs tracking-[0.16em] text-white/50 uppercase">
                Signed in as {user?.email}
              </p>
              <Link
                to="/admin"
                className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-ink"
              >
                Super admin
              </Link>
            </div>
          ) : (
            <p className="text-center text-xs tracking-[0.16em] text-white/50 uppercase">
              Family access only
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
