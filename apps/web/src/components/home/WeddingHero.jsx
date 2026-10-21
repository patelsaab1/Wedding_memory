import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WEDDING_DATE } from '@/components/home/wedding-journey';

const PHRASES = [
  'Rohit ♥ Roshni',
  'Two Hearts, One Story',
  'Forever Starts Here',
  'Our Beautiful Beginning',
  'A Love Worth Remembering',
];

const FLOATS = [
  {
    id: 'roshni',
    src: '/hero/roshni-640.webp',
    fallback: '/hero/roshni-640.jpg',
    alt: 'Roshni in bridal jewellery',
    width: 640,
    height: 960,
    className: 'hero-float hero-float--left',
  },
  {
    id: 'gaze',
    src: '/hero/gaze-640.webp',
    fallback: '/hero/gaze-640.jpg',
    alt: 'Rohit and Roshni standing close',
    width: 640,
    height: 960,
    className: 'hero-float hero-float--right',
  },
  {
    id: 'veil',
    src: '/hero/veil-480.webp',
    fallback: '/hero/veil-480.jpg',
    alt: 'Roshni behind her wedding veil',
    width: 480,
    height: 720,
    className: 'hero-float hero-float--low',
  },
];

function HeroHeart() {
  return (
    <span className="hero-heart" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="1em" height="1em" focusable="false">
        <path
          fill="currentColor"
          d="M12 21s-6.72-4.28-9.4-8.18C.4 9.9.95 6.2 3.92 4.7 6.2 3.5 8.55 4.45 12 7.7c3.45-3.25 5.8-4.2 8.08-3 2.97 1.5 3.52 5.2 1.32 8.12C18.72 16.72 12 21 12 21z"
        />
      </svg>
    </span>
  );
}

function RotatingPhrases() {
  const rootRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let onScreen = true;
    let fadeTimer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    const cycleTimer = window.setInterval(() => {
      if (!onScreen) return;
      setShown(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % PHRASES.length);
        setShown(true);
      }, 420);
    }, 4000);

    return () => {
      observer.disconnect();
      window.clearInterval(cycleTimer);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <p ref={rootRef} className={`hero-phrase ${shown ? 'is-in' : 'is-out'}`} aria-live="polite">
      {PHRASES[index]}
    </p>
  );
}

/**
 * Cinematic home hero. Names stay in HTML; photographs are local optimized assets.
 * @param {{ eyebrow?: string, description?: string }} props
 */
export function WeddingHero({ eyebrow, description }) {
  return (
    <section id="home-hero" className="wedding-hero scroll-mt-20">
      <div className="wedding-hero__stage">
        <picture>
          <source
            type="image/webp"
            srcSet="/hero/together-768.webp 768w, /hero/together-1280.webp 1280w, /hero/together-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            className="wedding-hero__bg"
            src="/hero/together-1280.jpg"
            srcSet="/hero/together-768.jpg 768w, /hero/together-1280.jpg 1280w, /hero/together-1920.jpg 1920w"
            sizes="100vw"
            width="1920"
            height="1280"
            alt="Rohit and Roshni on their wedding day"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="wedding-hero__veil" aria-hidden="true" />

        <span className="hero-spark hero-spark--a" aria-hidden="true">
          ♥
        </span>
        <span className="hero-spark hero-spark--b" aria-hidden="true">
          ♥
        </span>
        <span className="hero-spark hero-spark--c" aria-hidden="true">
          ♥
        </span>

        {FLOATS.map((photo) => (
          <figure key={photo.id} className={photo.className}>
            <picture>
              <source type="image/webp" srcSet={photo.src} />
              <img
                src={photo.fallback}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                decoding="async"
                className="hero-float__img"
              />
            </picture>
          </figure>
        ))}

        <div className="wedding-hero__copy">
          <p className="hero-eyebrow">{eyebrow || 'Private collection'}</p>
          <h1 className="hero-names" aria-label="Rohit and Roshni">
            <span>Rohit</span>
            <HeroHeart />
            <span>Roshni</span>
          </h1>
          <RotatingPhrases />
          {description ? <p className="hero-lead">{description}</p> : null}
          <div className="hero-meta">
            <span>{WEDDING_DATE}</span>
            <span aria-hidden="true">·</span>
            <a href="#home-timeline">Our story</a>
          </div>
          <Link to="/gallery" className="hero-cta">
            Enter the gallery
          </Link>
        </div>

        <a className="hero-scroll" href="#home-timeline">
          <span className="sr-only">Scroll to our story</span>
          <span aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
