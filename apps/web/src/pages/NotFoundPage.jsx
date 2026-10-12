import { Link } from 'react-router-dom';
import { Band } from '@/components/ui/Band';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';

export function NotFoundPage() {
  return (
    <Band tone="blush">
      <SectionIntro
        eyebrow="404"
        title="This page is not part of the day"
        description="The address does not match a gallery, album, or home section."
      />
      <Reveal>
        <Link to="/" className="bg-wine inline-flex rounded-full px-5 py-2.5 text-sm text-white">
          Back home
        </Link>
      </Reveal>
    </Band>
  );
}
