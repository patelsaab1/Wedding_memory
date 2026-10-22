import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { isSuperAdmin } from '@wedding-memory/shared';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAuth, useCurrentUser } from '@/features/auth/useAuth';
import {
  createAdminAlbum,
  createGuestLogin,
  endGuestLogin,
  getAlbumAccess,
  getAdminFolders,
  getAdminSections,
  getGuestLogins,
  reorderAdminSections,
  saveAdminSection,
  saveAlbumAccess,
  uploadAdminFile,
} from '@/services/admin.service';

const MENU = [
  { id: 'overview', label: 'Overview', mark: '01' },
  { id: 'sections', label: 'Home sections', mark: '02' },
  { id: 'guests', label: 'Guest logins', mark: '03' },
  { id: 'albums', label: 'Albums', mark: '04' },
  { id: 'photos', label: 'Photographs', mark: '05' },
];

const fieldClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-base outline-none focus:border-gold';

function moveItem(list, index, direction) {
  const next = [...list];
  const target = index + direction;
  if (target < 0 || target >= next.length) return list;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function PanelHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="text-gold text-[11px] font-medium tracking-[0.22em] uppercase">{eyebrow}</p>
      <h2 className="font-serif text-ink mt-2 text-2xl sm:text-3xl">{title}</h2>
      {description ? <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p> : null}
    </div>
  );
}

export function AdminPage() {
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get('panel');
  const panel = MENU.some((item) => item.id === requested) ? requested : 'overview';
  const [sections, setSections] = useState([]);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const [folders, setFolders] = useState([]);
  const [accessByFolder, setAccessByFolder] = useState({});
  const [dragging, setDragging] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRole, setGuestRole] = useState('family');
  const [guestDays, setGuestDays] = useState('7');
  const [issuedLogin, setIssuedLogin] = useState(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState([]);
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin(user)) return undefined;
    let active = true;
    Promise.all([
      getAdminSections(),
      getAdminFolders().catch(() => []),
      getGuestLogins().catch(() => []),
      getAlbumAccess().catch(() => []),
    ])
      .then(([sectionList, folderList, guestList, accessList]) => {
        if (!active) return;
        setSections(sectionList);
        setFolders(folderList);
        setGuests(guestList);
        setAccessByFolder(Object.fromEntries((accessList || []).map((row) => [row.folderId, row])));
        setFolderId(folderList[0]?.id || '');
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'The master panel could not be opened');
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!isSuperAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  const current = MENU.find((item) => item.id === panel) || MENU[0];
  const activeGuests = guests.filter((guest) => guest.status === 'active').length;

  function openPanel(id) {
    setParams({ panel: id }, { replace: true });
  }

  function updateLocal(key, patch) {
    setSections((currentSections) => currentSections.map((section) => (
      section.key === key ? { ...section, ...patch } : section
    )));
  }

  async function persistSection(section) {
    setError('');
    setNotice('');
    try {
      const saved = await saveAdminSection(section.key, {
        title: section.title,
        eyebrow: section.eyebrow,
        description: section.description,
        enabled: section.enabled,
      });
      updateLocal(section.key, saved);
      setNotice(`Saved “${saved.title}”. Refresh the home page to see it.`);
    } catch (saveError) {
      setError(saveError.message || 'That section could not be saved');
    }
  }

  async function persistOrder(next) {
    setSections(next);
    setError('');
    try {
      const saved = await reorderAdminSections(next.map((section) => section.key));
      setSections(saved);
      setNotice('Home section order saved.');
    } catch (orderError) {
      setError(orderError.message || 'The new order could not be saved');
    }
  }

  async function addGuest(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setIssuedLogin(null);
    try {
      const created = await createGuestLogin({
        name: guestName.trim(),
        email: guestEmail.trim(),
        role: guestRole,
        activeDays: Number(guestDays),
      });
      setIssuedLogin(created);
      setGuestName('');
      setGuestEmail('');
      setGuests(await getGuestLogins());
      setNotice('Login ready. Copy the password now. It will not be shown again.');
    } catch (guestError) {
      setError(guestError.message || 'That login could not be created');
    } finally {
      setBusy(false);
    }
  }

  async function stopGuest(userId) {
    setError('');
    setNotice('');
    try {
      await endGuestLogin(userId);
      setGuests(await getGuestLogins());
      setNotice('That login is turned off.');
    } catch (guestError) {
      setError(guestError.message || 'That login could not be turned off');
    }
  }

  function folderAccess(folderId) {
    return accessByFolder[folderId] || { folderId, secret: false, memberIds: [] };
  }

  function patchAccess(folderId, patch) {
    setAccessByFolder((current) => {
      const previous = current[folderId] || { folderId, secret: false, memberIds: [] };
      return { ...current, [folderId]: { ...previous, ...patch } };
    });
  }

  async function savePrivacy(folder) {
    const current = folderAccess(folder.id);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveAlbumAccess(folder.id, {
        secret: Boolean(current.secret),
        memberIds: current.memberIds || [],
      });
      setAccessByFolder((map) => ({ ...map, [folder.id]: saved }));
      setNotice(saved.secret
        ? `“${folder.title}” is private. Only the people you ticked can open it.`
        : `“${folder.title}” is open to every signed-in guest.`);
    } catch (accessError) {
      setError(accessError.message || 'Album privacy could not be saved');
    } finally {
      setBusy(false);
    }
  }

  async function addAlbum(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const album = await createAdminAlbum(albumTitle);
      setAlbumTitle('');
      const folderList = await getAdminFolders();
      setFolders(folderList);
      setFolderId(album.id);
      setNotice(`Album “${album.title}” is now in Drive.`);
    } catch (albumError) {
      setError(albumError.message || 'The album could not be created');
    } finally {
      setBusy(false);
    }
  }

  function markUpload(index, patch) {
    setUploads((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  }

  async function addPhotos(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('photos');
    const files = input instanceof HTMLInputElement ? [...(input.files || [])] : [];
    if (!folderId || files.length === 0) {
      setError('Choose an album and at least one file');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    setUploads(files.map((file) => ({ name: file.name, status: 'waiting', percent: 0 })));
    let finished = 0;
    try {
      for (let index = 0; index < files.length; index += 1) {
        markUpload(index, { status: 'uploading', percent: 0 });
        await uploadAdminFile(folderId, files[index], (percent) => {
          markUpload(index, { status: 'uploading', percent });
        });
        finished += 1;
        markUpload(index, { status: 'done', percent: 100 });
      }
      if (input instanceof HTMLInputElement) input.value = '';
      setPicked([]);
      setNotice(finished === 1 ? '1 file added to Drive.' : `${finished} files added to Drive.`);
    } catch (uploadError) {
      const failedIndex = finished;
      markUpload(failedIndex, { status: 'failed' });
      setError(uploadError.message || 'Upload stopped before every file was stored');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title={current.label}
      email={user?.email}
      menu={MENU}
      active={panel}
      onSelect={openPanel}
      onLogout={() => logout()}
    >
      {error ? (
        <p className="mb-4 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-4 max-w-3xl rounded-2xl border border-gold/30 bg-blush px-4 py-3 text-sm">{notice}</p>
      ) : null}

      {panel === 'overview' ? (
        <section>
          <PanelHeading
            eyebrow="Dashboard"
            title="Manage from one place"
            description="Home copy, family logins, albums, and uploads each have their own screen. Use Menu to open or hide the sidebar."
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => openPanel('sections')} className="rounded-3xl border border-stone-200 bg-white p-5 text-left">
              <p className="text-muted text-xs tracking-[0.16em] uppercase">Home sections</p>
              <p className="font-serif mt-2 text-3xl">{sections.length}</p>
              <p className="text-muted mt-1 text-sm">{sections.filter((section) => section.enabled).length} visible</p>
            </button>
            <button type="button" onClick={() => openPanel('guests')} className="rounded-3xl border border-stone-200 bg-white p-5 text-left">
              <p className="text-muted text-xs tracking-[0.16em] uppercase">Guest logins</p>
              <p className="font-serif mt-2 text-3xl">{activeGuests}</p>
              <p className="text-muted mt-1 text-sm">{guests.length} created</p>
            </button>
            <button type="button" onClick={() => openPanel('albums')} className="rounded-3xl border border-stone-200 bg-white p-5 text-left">
              <p className="text-muted text-xs tracking-[0.16em] uppercase">Albums</p>
              <p className="font-serif mt-2 text-3xl">{folders.length}</p>
              <p className="text-muted mt-1 text-sm">Drive folders</p>
            </button>
            <button type="button" onClick={() => openPanel('photos')} className="rounded-3xl border border-stone-200 bg-white p-5 text-left">
              <p className="text-muted text-xs tracking-[0.16em] uppercase">Photographs</p>
              <p className="font-serif mt-2 text-3xl">Add</p>
              <p className="text-muted mt-1 text-sm">Photos and films</p>
            </button>
          </div>
        </section>
      ) : null}

      {panel === 'sections' ? (
        <section>
          <PanelHeading
            eyebrow="Home"
            title="Sections"
            description="Drag a row, or use the arrows. Title and the short line are what the family reads."
          />
          <ol className="max-w-3xl space-y-3">
            {sections.map((section, index) => (
              <li
                key={section.key}
                draggable
                onDragStart={() => setDragging(section.key)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dragging || dragging === section.key) return;
                  const from = sections.findIndex((item) => item.key === dragging);
                  const next = [...sections];
                  const [item] = next.splice(from, 1);
                  next.splice(index, 0, item);
                  setSections(next);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging('');
                  persistOrder(sectionsRef.current);
                }}
                className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-gold text-[11px] tracking-[0.2em] uppercase">{section.key}</p>
                  <div className="flex gap-2">
                    <button type="button" className="min-h-9 rounded-full border border-stone-300 px-3 text-xs" onClick={() => persistOrder(moveItem(sections, index, -1))}>
                      Up
                    </button>
                    <button type="button" className="min-h-9 rounded-full border border-stone-300 px-3 text-xs" onClick={() => persistOrder(moveItem(sections, index, 1))}>
                      Down
                    </button>
                  </div>
                </div>
                <label className="mt-3 block text-sm">
                  Small label
                  <input
                    value={section.eyebrow}
                    onChange={(event) => updateLocal(section.key, { eyebrow: event.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="mt-3 block text-sm">
                  Title
                  <input
                    value={section.title}
                    onChange={(event) => updateLocal(section.key, { title: event.target.value })}
                    className={`${fieldClass} font-serif text-lg`}
                  />
                </label>
                {section.key === 'album_note' ? (
                  <p className="text-muted mt-3 text-sm">This page opens the book. It does not add a block on the home page.</p>
                ) : null}
                <label className="mt-3 block text-sm">
                  {section.key === 'album_note' ? 'Line on the blank page' : 'Short description'}
                  <textarea
                    value={section.description}
                    onChange={(event) => updateLocal(section.key, { description: event.target.value })}
                    rows={2}
                    maxLength={400}
                    className={fieldClass}
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(event) => updateLocal(section.key, { enabled: event.target.checked })}
                    />
                    {section.key === 'album_note' ? 'Show this page in the book' : 'Show on the home page'}
                  </label>
                  <button
                    type="button"
                    onClick={() => persistSection(section)}
                    className="bg-wine min-h-11 rounded-full px-4 text-sm text-white"
                  >
                    Save section
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {panel === 'guests' ? (
        <section>
          <PanelHeading
            eyebrow="Family access"
            title="Allow an email"
            description="Make a login you can send. Choose how many days it stays open. After that, the same email and password stop working."
          />
          <form onSubmit={addGuest} className="grid max-w-xl gap-3">
            <label className="text-sm">
              Name
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Who is this for"
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="name@email.com"
                className={fieldClass}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                What they can open
                <select
                  value={guestRole}
                  onChange={(event) => setGuestRole(event.target.value)}
                  className={fieldClass}
                >
                  <option value="family">Photos and films</option>
                  <option value="viewer">Photos only</option>
                </select>
              </label>
              <label className="text-sm">
                Stays active for
                <select
                  value={guestDays}
                  onChange={(event) => setGuestDays(event.target.value)}
                  className={fieldClass}
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </label>
            </div>
            <button type="submit" disabled={busy} className="bg-ink min-h-11 w-fit rounded-full px-5 text-sm text-white">
              {busy ? 'Working…' : 'Create login'}
            </button>
          </form>
          {issuedLogin ? (
            <div className="mt-6 max-w-xl rounded-2xl border border-gold/30 bg-blush px-5 py-4 text-sm">
              <p className="font-medium">Send this once</p>
              <p className="mt-3">Email: {issuedLogin.email}</p>
              <p className="mt-1">Password: {issuedLogin.password}</p>
              <p className="text-muted mt-1">
                Open until {issuedLogin.accessExpiresAt ? new Date(issuedLogin.accessExpiresAt).toLocaleString() : 'you turn it off'}
              </p>
            </div>
          ) : null}
          {guests.length ? (
            <ul className="mt-8 max-w-xl space-y-3">
              {guests.map((guest) => (
                <li key={guest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-muted break-all">{guest.email}</p>
                    <p className="text-muted mt-1 text-xs">
                      {guest.status === 'active' ? 'Active' : 'Ended'}
                      {guest.accessExpiresAt ? ` · until ${new Date(guest.accessExpiresAt).toLocaleString()}` : ''}
                      {guest.role === 'viewer' ? ' · photos only' : ' · photos and films'}
                    </p>
                  </div>
                  {guest.status === 'active' ? (
                    <button type="button" className="min-h-9 rounded-full border border-stone-300 px-3 text-xs" onClick={() => stopGuest(guest.id)}>
                      Turn off
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {panel === 'albums' ? (
        <section>
          <PanelHeading
            eyebrow="Drive"
            title="New album"
            description="Creates a folder inside the wedding Photos folder. Albums stay open to every guest until you mark one private."
          />
          <form onSubmit={addAlbum} className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={albumTitle}
              onChange={(event) => setAlbumTitle(event.target.value)}
              placeholder="Album title"
              className="min-h-11 flex-1 rounded-full border border-stone-300 bg-white px-4 text-sm"
            />
            <button type="submit" disabled={busy} className="bg-ink min-h-11 rounded-full px-5 text-sm text-white">
              Add album
            </button>
          </form>
          {folders.length ? (
            <ul className="mt-8 max-w-xl space-y-3">
              {folders.map((folder) => {
                const access = folderAccess(folder.id);
                const members = new Set(access.memberIds || []);
                return (
                  <li key={folder.id} className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-ink font-medium">{folder.title}</p>
                      <label className="flex min-h-9 items-center gap-2 text-xs tracking-wide uppercase">
                        <input
                          type="checkbox"
                          checked={Boolean(access.secret)}
                          disabled={busy}
                          onChange={(event) => patchAccess(folder.id, { secret: event.target.checked })}
                        />
                        Private
                      </label>
                    </div>
                    {access.secret ? (
                      <fieldset className="mt-4 border-t border-stone-100 pt-3">
                        <legend className="text-muted text-xs">Who can open this album</legend>
                        {guests.length ? (
                          <ul className="mt-2 space-y-2">
                            {guests.map((guest) => (
                              <li key={guest.id}>
                                <label className="flex min-h-9 items-start gap-2">
                                  <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={members.has(guest.id)}
                                    disabled={busy}
                                    onChange={(event) => {
                                      const next = new Set(members);
                                      if (event.target.checked) next.add(guest.id);
                                      else next.delete(guest.id);
                                      patchAccess(folder.id, { memberIds: [...next] });
                                    }}
                                  />
                                  <span>
                                    {guest.name}
                                    <span className="text-muted block text-xs">
                                      {guest.email}
                                      {guest.role === 'viewer' ? ' · photos only' : ' · photos and films'}
                                      {guest.status !== 'active' ? ' · login ended' : ''}
                                    </span>
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted mt-2 text-xs leading-relaxed">
                            Only you can open it until you create a guest login and tick their name.
                          </p>
                        )}
                      </fieldset>
                    ) : (
                      <p className="text-muted mt-2 text-xs">Open to every signed-in guest.</p>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => savePrivacy(folder)}
                      className="border-ink text-ink mt-4 min-h-9 rounded-full border px-4 text-xs"
                    >
                      Save access
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {panel === 'photos' ? (
        <section>
          <PanelHeading
            eyebrow="Library"
            title="Add photographs"
            description="JPEG, PNG, WebP, GIF, MP4, MOV, or WebM. Each file stays under 40 MB and is sent to Drive through the server."
          />
          <form onSubmit={addPhotos} className="grid max-w-xl gap-4 rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
            <label className="text-sm">
              Album
              <select
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                disabled={busy}
                className={fieldClass}
              >
                {folders.length === 0 ? <option value="">No Drive folders yet</option> : null}
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.title}</option>
                ))}
              </select>
            </label>
            <label className="border-gold/40 bg-blush flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center">
              <span className="text-ink text-sm font-medium">Choose photographs or films</span>
              <span className="text-muted mt-1 text-xs">JPEG, PNG, WebP, GIF, MP4, MOV, or WebM. Each file under 40 MB.</span>
              <input
                name="photos"
                type="file"
                accept="image/*,video/mp4,video/quicktime,video/webm"
                multiple
                disabled={busy}
                className="sr-only"
                onChange={(event) => {
                  setUploads([]);
                  setPicked([...(event.target.files || [])].map((file) => file.name));
                }}
              />
            </label>
            {picked.length && uploads.length === 0 ? (
              <ul className="text-muted space-y-1 text-sm">
                {picked.map((name, index) => (
                  <li key={`${name}-${index}`} className="truncate">{name}</li>
                ))}
              </ul>
            ) : null}
            {uploads.length ? (
              <div role="status" aria-live="polite" className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>
                      {uploads.filter((item) => item.status === 'done').length} of {uploads.length} stored
                    </span>
                    <span>
                      {Math.round(uploads.reduce((sum, item) => sum + item.percent, 0) / uploads.length)}%
                    </span>
                  </div>
                  <div className="bg-blush h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-wine h-full rounded-full transition-[width] duration-200"
                      style={{ width: `${Math.round(uploads.reduce((sum, item) => sum + item.percent, 0) / uploads.length)}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-2">
                  {uploads.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">{item.name}</span>
                        <span className="text-muted shrink-0 text-xs">
                          {item.status === 'done' ? 'Stored' : null}
                          {item.status === 'failed' ? 'Stopped' : null}
                          {item.status === 'uploading' ? `${item.percent}%` : null}
                          {item.status === 'waiting' ? 'Waiting' : null}
                        </span>
                      </div>
                      {item.status === 'uploading' ? (
                        <div className="bg-blush mt-1 h-1 overflow-hidden rounded-full">
                          <div className="bg-gold h-full" style={{ width: `${item.percent}%` }} />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button type="submit" disabled={busy} className="bg-wine min-h-11 w-fit rounded-full px-5 text-sm text-white">
              {busy ? 'Uploading…' : 'Add to Drive'}
            </button>
          </form>
        </section>
      ) : null}
    </AdminShell>
  );
}
