import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoupleLogo } from '@/components/admin/CoupleLogo';

/**
 * Full-screen master panel. The sidebar is a drawer on small screens and a collapsible column on desktop.
 * @param {{
 *   title: string,
 *   email?: string,
 *   menu: { id: string, label: string, mark: string }[],
 *   active: string,
 *   onSelect: (id: string) => void,
 *   onLogout: () => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function AdminShell({ title, email, menu, active, onSelect, onLogout, children }) {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuOpen = wide ? !collapsed : mobileOpen;

  useEffect(() => {
    const apply = () => {
      const matches = window.matchMedia('(min-width: 1024px)').matches;
      setWide(matches);
      if (matches) setMobileOpen(false);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  function toggleMenu() {
    if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed((value) => !value);
    else setMobileOpen((value) => !value);
  }

  function choose(id) {
    onSelect(id);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-stone-200 bg-white text-ink transition-[transform,width] duration-700 ease-in-out lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[4.75rem]' : 'lg:w-72'}`}
      >
        <div className={`flex h-[4.5rem] items-center border-b border-stone-200 bg-blush px-4 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <CoupleLogo />
          </div>
          <div className={`hidden ${collapsed ? 'lg:block' : ''}`}>
            <CoupleLogo compact />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Master panel">
          {menu.map((item) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                title={item.label}
                className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm transition ${
                  selected ? 'bg-wine text-white' : 'text-ink hover:bg-blush'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium ${
                    selected ? 'bg-white/20 text-white' : 'bg-blush text-wine'
                  }`}
                >
                  {item.mark}
                </span>
                <span className={collapsed ? 'lg:sr-only' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-stone-200 p-3">
          {email ? (
            <p className={`text-muted truncate px-2 text-xs ${collapsed ? 'lg:hidden' : ''}`} title={email}>
              {email}
            </p>
          ) : null}
          <Link
            to="/"
            className={`text-ink hover:bg-blush flex min-h-11 items-center rounded-2xl px-3 text-sm ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title="View site"
          >
            <span className={collapsed ? 'lg:hidden' : ''}>View site</span>
            <span className={`hidden text-xs ${collapsed ? 'lg:inline' : ''}`}>Home</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className={`text-ink hover:bg-blush flex min-h-11 w-full items-center rounded-2xl px-3 text-left text-sm ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title="Sign out"
          >
            <span className={collapsed ? 'lg:sr-only' : ''}>Sign out</span>
            <span className={`hidden text-xs ${collapsed ? 'lg:inline' : ''}`}>Out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-stone-200 bg-white px-3 sm:px-5">
          <button
            type="button"
            className="text-ink shrink-0 rounded-full border border-stone-300 bg-blush px-3 py-1.5 text-sm"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={toggleMenu}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <div className="lg:hidden">
            <CoupleLogo compact />
          </div>
          <h1 className="font-serif text-ink min-w-0 flex-1 truncate text-xl sm:text-2xl">{title}</h1>
          <Link to="/" className="text-muted hidden shrink-0 text-sm sm:inline">
            View site
          </Link>
        </header>
        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
