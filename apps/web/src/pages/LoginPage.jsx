import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FloatingOrbs } from '@/components/ui/FloatingOrbs';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

export function LoginPage() {
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-surface px-4 py-16">
      <FloatingOrbs />
      <Reveal className="relative mx-auto w-full max-w-md rounded-3xl border border-white bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">Welcome</p>
        <h1 className="font-serif text-ink mt-3 text-4xl">Sign in</h1>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          A private entrance for Rohit and Roshni’s family.
        </p>
        {isAuthenticated ? (
          <p className="mt-4 rounded-xl border border-gold/30 bg-blush px-3 py-2 text-sm">
            Signed in as {user?.email || user?.name || 'another account'}. Submit this form to switch.
            <button type="button" className="text-wine ml-2 font-medium" onClick={() => logout()}>
              Sign out
            </button>
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="text-muted mb-1.5 block">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted mb-1.5 block">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="!bg-wine w-full !rounded-full !py-2.5">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Reveal>
    </section>
  );
}
