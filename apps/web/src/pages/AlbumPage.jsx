import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Band } from '@/components/ui/Band';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { GalleryMedia } from '@/components/gallery/PhotoGrid';
import { HomeSlider } from '@/components/home/HomeSlider';
import { getGalleryAlbum } from '@/services/gallery.service';
import { getHomeSections } from '@/services/admin.service';

export function AlbumPage() {
  const { folderId } = useParams();
  const [album, setAlbum] = useState(null);
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getGalleryAlbum(folderId)
      .then((data) => {
        if (active) setAlbum(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Album could not be loaded');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [folderId]);

  useEffect(() => {
    let active = true;
    getHomeSections()
      .then((sections) => {
        if (!active) return;
        const found = (sections || []).find((section) => section.key === 'album_note') || null;
        setNote(found);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const title = album?.album?.title || 'Album';
  const stills = (album?.photos || []).filter((photo) => photo?.previewPath && photo.kind !== 'video');
  const films = (album?.photos || []).filter((photo) => photo?.kind === 'video');

  return (
    <div>
      <Band tone="white" className="!py-12 sm:!py-16">
        <Reveal>
          <Link to="/gallery" className="text-muted text-sm">
            Back to gallery
          </Link>
        </Reveal>
        <SectionIntro
          eyebrow="Album"
          title={title}
          description={films.length
            ? 'Turn the photographs. The films from this folder sit just below the book.'
            : 'Turn the pages of this folder.'}
        />
        {loading ? <p className="text-muted text-sm">Loading photos…</p> : null}
        {error ? (
          <p className="max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </Band>

      <Band tone="ivory" className="!pt-0">
        {stills.length ? <HomeSlider key={folderId} photos={stills} note={note} /> : null}
        {films.length ? (
          <div className="mx-auto mt-12 grid max-w-3xl gap-6">
            {films.map((film) => (
              <GalleryMedia key={film.id} item={film} layout="strip" />
            ))}
          </div>
        ) : null}
        {!loading && album && stills.length === 0 && films.length === 0 ? (
          <p className="text-muted text-sm">This folder does not have photos or films yet.</p>
        ) : null}
      </Band>
    </div>
  );
}
