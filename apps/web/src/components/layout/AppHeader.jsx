import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { isSuperAdmin } from '@wedding-memory/shared';
import { HOME_CHAPTERS } from '@/components/home/home-chapters';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/features/auth/useAuth';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/gallery', label: 'Gallery' },
  { to: '/status', label: 'Status' },
];

function linkClass({ isActive }) {
  return `text-sm transition-colors duration-500 ease-in-out ${isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`;
}

function ChapterList({ onPick, className = '' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function goChapter(event, key) {
    event.preventDefault();
    const id = `home-${key}`;
    onPick();
    if (pathname === '/') {
      const node = document.getElementById(id);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${id}`);
        return;
      }
    }
    navigate({ pathname: '/', hash: id });
  }

  return (
    <div className={className}>
      <p className="text-gold px-2 pb-2 text-[11px] font-medium tracking-[0.28em] uppercase">About</p>
      <div className="grid max-h-[50vh] grid-cols-2 gap-1 overflow-y-auto sm:max-h-none">
        {HOME_CHAPTERS.map((chapter) => (
          <Link
            key={chapter.key}
            to={{ pathname: '/', hash: `home-${chapter.key}` }}
            className="text-ink hover:bg-blush rounded-xl px-2 py-2.5 text-sm leading-snug"
            onClick={(event) => goChapter(event, chapter.key)}
          >
            {chapter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AppHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const aboutRef = useRef(null);
  const showAdmin = isSuperAdmin(user);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!aboutOpen) return undefined;
    const onPointer = (event) => {
      if (!aboutRef.current?.contains(event.target)) setAboutOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [aboutOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow] duration-500 ease-in-out ${scrolled ? 'border-stone-200/80 bg-white/95 shadow-sm' : 'border-transparent bg-white'}`}>
      <Container wide className="flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-16 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="font-serif text-ink truncate text-base tracking-wide sm:text-lg" onClick={() => setOpen(false)}>
              Rohit & Roshni
            </Link>
            {showAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="bg-wine shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium text-white sm:px-4 sm:py-1.5 sm:text-sm"
              >
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Super admin</span>
              </Link>
            ) : null}
          </div>
          {isAuthenticated ? (
            <p className="text-muted hidden truncate text-[11px] sm:block">
              Signed in as {user?.email || user?.name}
              {showAdmin ? null : (
                <>
                  {' · '}
                  <Link to="/login" className="text-wine font-medium">
                    Switch account
                  </Link>
                </>
              )}
            </p>
          ) : null}
        </div>

        <nav className="hidden items-center gap-5 lg:gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          <div className="relative" ref={aboutRef}>
            <button
              type="button"
              className="text-muted hover:text-ink text-sm transition-colors duration-500 ease-in-out"
              aria-expanded={aboutOpen}
              aria-haspopup="true"
              onClick={() => setAboutOpen((value) => !value)}
            >
              About
            </button>
            {aboutOpen ? (
              <div className="absolute top-full right-0 z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
                <ChapterList onPick={() => setAboutOpen(false)} />
              </div>
            ) : null}
          </div>
          {isAuthenticated ? (
            <button type="button" className="text-muted text-sm" onClick={() => logout()}>
              Sign out
            </button>
          ) : null}
        </nav>

        <button
          type="button"
          className="text-ink shrink-0 rounded-full border border-stone-300 px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </Container>

      <div id="mobile-nav" className={`nav-panel md:!hidden ${open ? 'is-open' : ''}`}>
        <div className="nav-panel-inner">
          <nav className="flex max-h-[min(80vh,36rem)] flex-col gap-3 overflow-y-auto border-t border-stone-200 bg-white px-4 py-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={(state) => `nav-link ${linkClass(state)}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <ChapterList className="nav-link border-t border-stone-100 pt-3" onPick={() => setOpen(false)} />
            {showAdmin ? (
              <Link to="/admin" className="nav-link text-wine text-sm font-medium" onClick={() => setOpen(false)}>
                Super admin
              </Link>
            ) : null}
            {isAuthenticated ? (
              <p className="nav-link text-muted text-xs break-all">
                {user?.email || user?.name}
                {user?.role ? ` · ${user.role}` : ''}
              </p>
            ) : null}
            {isAuthenticated ? (
              <button type="button" className="nav-link text-left text-sm" onClick={() => logout()}>
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
