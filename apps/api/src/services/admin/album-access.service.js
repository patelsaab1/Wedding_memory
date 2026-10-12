import { USER_ROLES } from '@wedding-memory/shared';
import { AlbumAccess } from '../../models/album-access.model.js';
import { User } from '../../models/user.model.js';
import { badRequestError, forbiddenError } from '../../utils/errors.js';

const ACCESS_CACHE_MS = 15_000;
const GUEST_ROLES = [USER_ROLES.FAMILY, USER_ROLES.VIEWER];

/** @type {{ at: number, rows: Array<{ folderId: string, memberIds: unknown[] }> | null }} */
let accessCache = { at: 0, rows: null };

export function clearAlbumAccessCache() {
  accessCache = { at: 0, rows: null };
}

/**
 * Couple accounts keep every album. Family and photo-only logins need a grant.
 *
 * @param {{ role?: string } | null | undefined} user
 */
export function userSeesEveryAlbum(user) {
  return user?.role === USER_ROLES.MASTER || user?.role === USER_ROLES.WIFE;
}

/**
 * @param {object | null | undefined} gallery
 * @param {Set<string>} hidden
 */
export function applyAlbumPrivacy(gallery, hidden) {
  if (!gallery?.ready || !hidden?.size) return gallery;

  const blocked = (id) => Boolean(id) && hidden.has(id);
  const coupleHidden = blocked(gallery.coupleFolderId) || blocked(gallery.coupleParentId);

  return {
    ...gallery,
    slider: blocked(gallery.sliderFolderId) ? [] : gallery.slider,
    featured: blocked(gallery.featuredFolderId) ? [] : gallery.featured,
    couple: coupleHidden ? [] : (gallery.couple || []),
    haldi: gallery.haldi
      ? {
          ...gallery.haldi,
          photos: blocked(gallery.haldi.id) ? [] : gallery.haldi.photos,
        }
      : gallery.haldi,
    albums: (gallery.albums || []).filter((album) => !blocked(album.id) && !blocked(album.parentId)),
    trailer: gallery.trailer && blocked(gallery.trailer.id) ? null : gallery.trailer,
  };
}

async function secretRows() {
  if (accessCache.rows && Date.now() - accessCache.at < ACCESS_CACHE_MS) {
    return accessCache.rows;
  }

  const rows = await AlbumAccess.find({ secret: true }).select('folderId memberIds').lean();
  accessCache = { at: Date.now(), rows };
  return rows;
}

/**
 * @param {{ id?: string, _id?: unknown, role?: string } | null | undefined} user
 */
export async function hiddenFolderIdsFor(user) {
  if (!user || userSeesEveryAlbum(user)) return new Set();

  const userId = String(user.id || user._id || '');
  const rows = await secretRows();
  const hidden = new Set();

  for (const row of rows) {
    const allowed = (row.memberIds || []).some((memberId) => String(memberId) === userId);
    if (!allowed) hidden.add(row.folderId);
  }

  return hidden;
}

/**
 * @param {string[]} folderIds
 * @param {{ id?: string, role?: string } | null | undefined} user
 */
export async function assertFolderOpen(folderIds, user) {
  if (!user) return;

  const hidden = await hiddenFolderIdsFor(user);
  if (folderIds.some((folderId) => hidden.has(folderId))) {
    throw forbiddenError('This album is private');
  }
}

function mapAccess(doc) {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    folderId: json.folderId,
    secret: Boolean(json.secret),
    memberIds: (json.memberIds || []).map((memberId) => String(memberId)),
  };
}

export async function listAlbumAccess() {
  const rows = await AlbumAccess.find().sort({ updatedAt: -1 });
  return rows.map(mapAccess);
}

/**
 * @param {string} folderId
 * @param {{ secret: boolean, memberIds: string[] }} input
 */
export async function saveAlbumAccess(folderId, input) {
  const memberIds = [...new Set(input.memberIds || [])];
  const guests = memberIds.length
    ? await User.find({ _id: { $in: memberIds }, role: { $in: GUEST_ROLES } }).select('_id')
    : [];

  if (guests.length !== memberIds.length) {
    throw badRequestError('Private albums can only be opened by family or photo-only logins');
  }

  const saved = await AlbumAccess.findOneAndUpdate(
    { folderId },
    { folderId, secret: Boolean(input.secret), memberIds: guests.map((guest) => guest._id) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  clearAlbumAccessCache();
  return mapAccess(saved);
}
