import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { SiteFooter } from '@/components/layout/SiteFooter';

export function AppShell() {
  const { pathname } = useLocation();

  if (pathname === '/admin') {
    return (
      <div className="min-h-screen bg-surface">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip">
      <ScrollProgress />
      <AppHeader />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
