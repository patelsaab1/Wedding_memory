import { API_PREFIX } from '@wedding-memory/shared';

const ROLE_MATCHERS = [
  { role: 'slider', names: ['slider'] },
  { role: 'featured', names: ['topfetured', 'topfeatured', 'topfeature'] },
  { role: 'haldi', names: ['haldi'] },
  { role: 'couple', names: ['coupleshoot', 'couple', 'coupleshots'] },
  { role: 'trailer', names: ['video', 'videos', 'trailer', 'intro', 'introvideo'] },
];

/**
 * @param {string} name
 */
export function normalizeFolderKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Map a Drive folder name onto a wedding-site section.
 * Haldi, Top Featured (including the "topFetured" folder), and Slider are special.
 * Every other folder becomes a gallery album.
 *
 * @param {string} name
 * @returns {'slider' | 'featured' | 'haldi' | 'couple' | 'trailer' | 'album'}
 */
export function galleryRoleForFolder(name) {
  const key = normalizeFolderKey(name);
  const match = ROLE_MATCHERS.find((item) => item.names.includes(key));
  return match?.role ?? 'album';
}

/**
 * @param {string} name
 * @param {'slider' | 'featured' | 'haldi' | 'couple' | 'trailer' | 'album'} [role]
 */
export function displayFolderTitle(name, role) {
  if (role === 'haldi') return 'Haldi';
  if (role === 'featured') return 'Top Featured';
  if (role === 'slider') return 'Slider';
  if (role === 'couple') return 'Couple shoot';
  if (role === 'trailer') return 'Wedding treasure';
  return String(name || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Array<{ id: string, name: string }>} folders
 */
export function partitionGalleryFolders(folders) {
  /** @type {{ slider: any, featured: any, haldi: any, couple: any, trailer: any, albums: any[] }} */
  const result = {
    slider: null,
    featured: null,
    haldi: null,
    couple: null,
    trailer: null,
    albums: [],
  };

  for (const folder of folders) {
    const role = galleryRoleForFolder(folder.name);
    const titled = {
      ...folder,
      role,
      title: displayFolderTitle(folder.name, role),
    };

    if (role === 'album') {
      result.albums.push(titled);
    } else if (!result[role]) {
      result[role] = titled;
    }
  }

  result.albums.sort((left, right) => left.title.localeCompare(right.title));
  return result;
}

/**
 * @param {string} [mimeType]
 * @returns {'image' | 'video' | null}
 */
export function galleryMediaKind(mimeType) {
  const mime = String(mimeType || '');
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

/**
 * @param {{ id: string, name: string, mimeType?: string }} file
 */
export function toGalleryPhoto(file) {
  const mimeType = file.mimeType ?? 'image/jpeg';
  const kind = galleryMediaKind(mimeType) ?? 'image';
  const contentPath = `${API_PREFIX}/gallery/files/${encodeURIComponent(file.id)}/content`;
  return {
    id: file.id,
    name: file.name,
    mimeType,
    kind,
    previewPath: kind === 'image' ? `${contentPath}?size=preview` : contentPath,
    fullPath: contentPath,
  };
}

/**
 * @param {string} name
 */
export function safeDownloadFilename(name) {
  const cleaned = String(name || 'photo')
    .replace(/["\r\n\\]/g, '')
    .slice(0, 180)
    .trim();
  return cleaned || 'photo';
}
