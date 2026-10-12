import { Container } from '@/components/ui/Container';

const tones = {
  ivory: 'bg-surface text-ink',
  blush: 'bg-blush text-ink',
  white: 'bg-white text-ink',
  wine: 'bg-wine text-white',
  ink: 'bg-ink text-white',
};

/**
 * Full-width section with an alternating background.
 * @param {{ id?: string, tone?: 'ivory' | 'blush' | 'white' | 'wine' | 'ink', children: import('react').ReactNode, className?: string }} props
 */
export function Band({ id, tone = 'ivory', children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 sm:py-24 ${tones[tone]} ${className}`}>
      <Container wide>{children}</Container>
    </section>
  );
}
