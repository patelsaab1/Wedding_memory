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
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="relative flex min-h-[100dvh] items-center overflow-x-clip bg-surface px-4 py-10 sm:py-16">
      <FloatingOrbs />
      <Reveal className="relative mx-auto w-full max-w-md rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:p-8">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">Welcome</p>
        <h1 className="font-serif text-ink mt-3 text-4xl">Sign in</h1>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          This house opens with email and password. Super admin uses the same door — not Google sign-in.
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
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-surface py-2.5 pr-11 pl-3 text-sm outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="text-muted hover:text-ink absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.1 10.2A2.6 2.6 0 0 0 12 14.6a2.6 2.6 0 0 0 2.5-1.7" />
      <path d="M6.4 6.6C4.2 8 2.5 12 2.5 12S6 17.5 12 17.5c2 0 3.7-.6 5.1-1.5M9.6 6.7C10.4 6.6 11.2 6.5 12 6.5 18 6.5 21.5 12 21.5 12a18.4 18.4 0 0 1-2.3 3.2" />
    </svg>
  );
}
