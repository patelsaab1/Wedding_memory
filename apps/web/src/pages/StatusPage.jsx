import { useEffect, useState } from 'react';
import { Band } from '@/components/ui/Band';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Button } from '@/components/ui/Button';
import { fetchHealth } from '@/services/health.service';

export function StatusPage() {
  const [state, setState] = useState({
    status: 'idle',
    payload: null,
    error: null,
  });

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

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <Band tone="white">
      <div>
        <SectionIntro
          eyebrow="System"
          title="API status"
          description="A quiet check that the wedding API and database are reachable."
        />

        <div className="mt-6">
          <Button onClick={loadHealth} disabled={state.status === 'loading'}>
            {state.status === 'loading' ? 'Checking…' : 'Refresh'}
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
      </div>
    </Band>
  );
}
