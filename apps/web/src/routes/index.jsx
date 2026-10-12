import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PERMISSIONS } from '@wedding-memory/shared';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/pages/HomePage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';

const StatusPage = lazy(() =>
  import('@/pages/StatusPage').then((module) => ({ default: module.StatusPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const GalleryPage = lazy(() =>
  import('@/pages/GalleryPage').then((module) => ({ default: module.GalleryPage })),
);
const AlbumPage = lazy(() =>
  import('@/pages/AlbumPage').then((module) => ({ default: module.AlbumPage })),
);
const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);

function RouteFallback() {
  return (
    <div className="text-muted flex min-h-[40vh] items-center justify-center text-sm">Loading…</div>
  );
}

/**
 * Application routes with route-level code splitting for non-critical pages.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route
            path="gallery"
            element={
              <RequirePermission permission={PERMISSIONS.MEDIA_VIEW}>
                <GalleryPage />
              </RequirePermission>
            }
          />
          <Route
            path="gallery/:folderId"
            element={
              <RequirePermission permission={PERMISSIONS.MEDIA_VIEW}>
                <AlbumPage />
              </RequirePermission>
            }
          />
          <Route path="status" element={<StatusPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
