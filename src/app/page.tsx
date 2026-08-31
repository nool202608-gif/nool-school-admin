'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/useAuth';

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/login');
    } else if (status !== 'loading' && status !== 'resolvingProfile' && status !== 'signingIn') {
      // authenticated / noProfile / wrongRole all land in (dashboard), which
      // renders the right state (the dashboard itself, or the
      // noProfile/wrongRole message) - see src/app/(dashboard)/layout.tsx.
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="login-shell">
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}
