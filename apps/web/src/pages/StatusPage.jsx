import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isSuperAdmin } from '@wedding-memory/shared';
import { Band } from '@/components/ui/Band';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/features/auth/useAuth';
import { fetchHealth } from '@/services/health.service';
import { fetchDriveStatus, refreshDriveToken, startDriveTokenUpdate } from '@/services/storage.service';

export function StatusPage() {
  const { user } = useCurrentUser();
  const master = isSuperAdmin(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState({
    status: 'idle',
    payload: null,
    error: null,
  });
  const [drive, setDrive] = useState({
    status: 'idle',
    payload: null,
    error: null,
  });
  const driveNotice = searchParams.get('drive');

  async function loadHealth() {
    setState({ status: 'loading', payload: null, error: null });
    try {
      const payload = await fetchHealth();
      setState({ status: 'success', payload, error: null });
    } catch (error) {
      setState({
        status: 'error',
        payload: null,
        error: error instanceof Error ? error.message : 'Unable to reach API',
      });
    }
  }

  async function loadDrive() {
    if (!master) return;
    setDrive({ status: 'loading', payload: null, error: null });
    try {
      const payload = await fetchDriveStatus();
      setDrive({ status: 'success', payload, error: null });
    } catch (error) {
      setDrive({
        status: 'error',
        payload: null,
        error: error instanceof Error ? error.message : 'Unable to read Drive status',
      });
    }
  }

  async function handleRefreshToken() {
    if (!master) {
      await loadHealth();
      return;
    }
    setDrive((current) => ({ ...current, status: 'loading', error: null }));
    try {
      await loadHealth();
      const payload = await refreshDriveToken();
      setDrive({ status: 'success', payload, error: null });
      if (payload?.needsUpdate) {
        startDriveTokenUpdate();
      }
    } catch (error) {
      setDrive({
        status: 'error',
        payload: null,
        error: error instanceof Error ? error.message : 'Unable to refresh the Drive token',
      });
    }
  }

  useEffect(() => {
    loadHealth();
    if (master) loadDrive();
  }, [master]);

  useEffect(() => {
    if (!driveNotice) return undefined;
    const timer = window.setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [driveNotice, setSearchParams]);

  const drivePayload = drive.payload;

  return (
    <Band tone="white">
      <div>
        <SectionIntro
          eyebrow="System"
          title="API status"
          description={
            master
              ? 'Check the house API, then refresh or update the Google Drive token from this page.'
              : 'A quiet check that the wedding API and database are reachable.'
          }
        />

        {driveNotice === 'connected' ? (
          <p className="mt-6 max-w-xl rounded-2xl border border-gold/25 bg-blush px-5 py-4 text-sm leading-relaxed text-stone-800">
            Google Drive token saved on the server. Photographs should open again.
          </p>
        ) : null}
        {driveNotice === 'failed' ? (
          <p className="mt-6 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-relaxed text-red-800">
            Google did not return a new Drive token. Sign in as {drivePayload?.accountHint || 'the house Gmail'} and try Update my token again.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={master ? handleRefreshToken : loadHealth} disabled={state.status === 'loading' || drive.status === 'loading'}>
            {state.status === 'loading' || drive.status === 'loading' ? 'Checking…' : master ? 'Refresh token' : 'Refresh'}
          </Button>
        </div>

        {state.status === 'error' && (
          <p className="mt-6 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        {state.status === 'success' && state.payload && (
          <pre className="text-ink mt-6 overflow-x-auto rounded-md bg-stone-100 p-4 text-xs">
            {JSON.stringify(state.payload, null, 2)}
          </pre>
        )}

        {master ? (
          <div className="mt-12 max-w-xl rounded-3xl border border-white bg-blush/60 p-6">
            <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">Google Drive</p>
            <h2 className="font-serif mt-2 text-3xl">House photos</h2>
            <p className="text-muted mt-3 text-sm leading-relaxed">
              Refresh token tries the token already on the server. If Google has revoked it, this page opens
              Gmail as {drivePayload?.accountHint || 'the house account'} so you can Allow once. You do not paste a token.
            </p>
            {drive.status === 'error' ? (
              <p className="mt-4 text-sm text-red-800" role="alert">
                {drive.error}
              </p>
            ) : null}
            {drivePayload ? (
              <p className="mt-4 text-sm leading-relaxed text-stone-800">
                {drivePayload.connected
                  ? 'Drive is connected.'
                  : drivePayload.message || 'Drive is not connected yet.'}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleRefreshToken} disabled={drive.status === 'loading'}>
                {drive.status === 'loading' ? 'Refreshing…' : 'Refresh token'}
              </Button>
              <Button onClick={startDriveTokenUpdate} className="!bg-wine">
                Update my token
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Band>
  );
}
