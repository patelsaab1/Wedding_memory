import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { isSuperAdmin } from '@wedding-memory/shared';
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

export function AppHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showAdmin = isSuperAdmin(user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow] duration-500 ease-in-out ${scrolled ? 'border-stone-200/80 bg-white/95 shadow-sm' : 'border-transparent bg-white'}`}>
      <Container wide className="flex min-h-16 items-center justify-between gap-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-serif text-ink truncate text-lg tracking-wide" onClick={() => setOpen(false)}>
              Rohit & Roshni
            </Link>
            {showAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="bg-wine shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white sm:px-4 sm:text-sm"
              >
                Super admin
              </Link>
            ) : null}
          </div>
          {isAuthenticated ? (
            <p className="text-muted truncate text-[11px]">
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

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
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
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </Container>

      <div className={`nav-panel md:!hidden ${open ? 'is-open' : ''}`}>
        <div className="nav-panel-inner">
          <nav className="flex flex-col gap-3 border-t border-stone-200 bg-white px-4 py-4">
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
            {showAdmin ? (
              <Link to="/admin" className="nav-link text-wine text-sm font-medium" onClick={() => setOpen(false)}>
                Super admin
              </Link>
            ) : null}
            {isAuthenticated ? (
              <p className="nav-link text-muted text-xs">
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
