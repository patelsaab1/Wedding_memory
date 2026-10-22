import { HouseImg } from '@/components/gallery/useHouseSrc';

/**
 * One photograph presented as a print, frame, or pinned photo.
 * @param {{
 *   photo: { id: string, name: string, previewPath: string },
 *   treatment?: 'editorial' | 'fine' | 'frame' | 'film' | 'polaroid' | 'pinned',
 *   label: string,
 *   caption?: string,
 *   rotate?: number,
 *   depth?: number,
 *   className?: string,
 *   onOpen?: () => void,
 * }} props
 */
export function ArtisticPhoto({
  photo,
  treatment = 'frame',
  label,
  caption = '',
  rotate = 0,
  depth = 10,
  className = '',
  onOpen,
}) {
  if (!photo?.previewPath) return null;

  return (
    <button
      type="button"
      data-label={label}
      className={`art-piece art-${treatment} ${className}`}
      style={{ '--rot': `${rotate}deg`, '--depth': `${depth}px` }}
      onClick={onOpen}
    >
      <span className="art-mat">
        <HouseImg photo={photo} className="art-img" />
      </span>
      {caption ? <span className="art-caption">{caption}</span> : null}
    </button>
  );
}
