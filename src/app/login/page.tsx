'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/useAuth';

export default function LoginPage() {
  const { status, profile, error, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(profile?.mustChangePassword ? '/change-password' : '/dashboard');
    }
  }, [status, profile, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    try {
      await signIn(email, password);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Could not sign in.');
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          nool<span>.</span> school
        </div>
        <h2 style={{ marginBottom: 4 }}>Sign in</h2>
        <p style={{ marginBottom: 24 }}>School Admin console.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="field"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="field"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {submitError ? (
            <p style={{ color: 'var(--color-red)', marginBottom: 12 }}>{submitError}</p>
          ) : error ? (
            <p style={{ color: 'var(--color-red)', marginBottom: 12 }}>{error.message}</p>
          ) : null}

          <button
            type="submit"
            className="btn dark"
            style={{ width: '100%', marginTop: 8 }}
            disabled={status === 'signingIn'}
          >
            {status === 'signingIn' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
