import { useEffect, useState } from 'react';

function prefersStillness() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True below desktop width, so extra floating frames are not downloaded.
 */
export function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  return narrow;
}

/**
 * Marks a section once it enters the viewport. Reduced motion shows the final state immediately.
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
export function useInView(ref) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (prefersStillness()) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return shown;
}

/**
 * Subtle pointer parallax. Skipped on touch and reduced motion, and paused off-screen.
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
export function useSoftParallax(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (prefersStillness() || window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    let frame = 0;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        node.style.setProperty('--px', '0');
        node.style.setProperty('--py', '0');
      }
    });
    observer.observe(node);

    const paint = (x, y) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--px', x.toFixed(3));
        node.style.setProperty('--py', y.toFixed(3));
      });
    };

    const onMove = (event) => {
      if (!visible) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      paint(x, y);
    };

    const reset = () => paint(0, 0);
    node.addEventListener('pointermove', onMove, { passive: true });
    node.addEventListener('pointerleave', reset);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', reset);
    };
  }, [ref]);
}
