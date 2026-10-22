import { Link } from 'react-router-dom';
import { Band } from '@/components/ui/Band';
import { Reveal } from '@/components/ui/Reveal';

export function NotFoundPage() {
  return (
    <Band tone="blush">
      <Reveal>
        <div className="mx-auto max-w-lg text-center sm:text-left">
          <p className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase">404</p>
          <h1 className="font-serif text-ink mt-4 text-4xl leading-tight sm:text-5xl">
            This page is not part of the day
          </h1>
          <p className="text-muted mt-4 text-sm leading-relaxed sm:text-base">
            The address does not match home, gallery, or an album. Go back and open a page from the menu.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="bg-wine inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium text-white"
            >
              Back home
            </Link>
            <Link
              to="/gallery"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 px-6 text-sm"
            >
              Open gallery
            </Link>
          </div>
        </div>
      </Reveal>
    </Band>
  );
}
