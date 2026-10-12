import { Reveal } from '@/components/ui/Reveal';

/**
 * @param {{ eyebrow?: string, title: string, description?: string, light?: boolean, id?: string }} props
 */
export function SectionIntro({ eyebrow, title, description, light = false, id }) {
  return (
    <Reveal>
      <div id={id} className="mb-8 max-w-2xl scroll-mt-24 sm:mb-12">
        {eyebrow ? (
          <p
            className={`mb-3 text-[11px] font-medium tracking-[0.28em] uppercase ${light ? 'text-white/70' : 'text-gold'}`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`font-serif text-3xl leading-tight sm:text-5xl ${light ? 'text-white' : 'text-ink'}`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-4 max-w-xl text-base leading-relaxed ${light ? 'text-white/80' : 'text-muted'}`}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
