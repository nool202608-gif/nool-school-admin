'use client';

import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut as firebaseSignOut, type User } from 'firebase/auth';

import { getFirebaseAuth } from './firebase';
import { apiRequest, login } from './apiClient';
import { AppError, AuthError, normalizeError } from './errors';
import type { Feature } from './types';

export interface Profile {
  id: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';
  displayName: string;
  school: string;
  /** See src/app/change-password/page.tsx, which this gates. */
  mustChangePassword: boolean;
  /** null = every feature enabled (no plan restriction) - see Sidebar.tsx's
   * NAV_GROUPS filtering, the only consumer of this field. */
  enabledFeatures: Feature[] | null;
}

interface MeResponse {
  profile: Profile | null;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signingIn' | 'resolvingProfile' | 'authenticated' | 'wrongRole' | 'noProfile';

export interface AuthContextValue {
  status: AuthStatus;
  profile: Profile | null;
  error: AppError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetches /me - used once the temp-password flow clears mustChangePassword server-side. */
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * School Admin only - a signed-in Firebase user whose real (server-verified)
 * role isn't SCHOOL_ADMIN lands on 'wrongRole', never given the admin shell.
 * Every actual API call is still separately gated server-side via
 * require_role - this is a UX gate, not the security boundary.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const activeRef = useRef(true);

  const resolveProfile = useCallback(async (user: User | null) => {
    if (!activeRef.current) return;

    if (!user) {
      setProfile(null);
      setStatus('signedOut');
      return;
    }

    setStatus('resolvingProfile');
    try {
      const response = await apiRequest<MeResponse>('/me');
      if (!activeRef.current) return;
      if (!response.profile) {
        setStatus('noProfile');
        return;
      }
      if (response.profile.role !== 'SCHOOL_ADMIN') {
        setProfile(response.profile);
        setStatus('wrongRole');
        return;
      }
      setProfile(response.profile);
      setError(null);
      setStatus('authenticated');
    } catch (cause) {
      if (!activeRef.current) return;
      const appError = normalizeError(cause);
      // An expired/invalid session (401) is not "no profile exists" - that
      // message ("contact your platform administrator") is actively wrong
      // for what's really a stale token. Sign out and let the normal
      // signedOut -> /login redirect handle it instead.
      if (appError instanceof AuthError) {
        setError(appError);
        void firebaseSignOut(getFirebaseAuth());
        return;
      }
      setError(appError);
      setStatus('noProfile');
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      void resolveProfile(user);
    });

    return () => {
      activeRef.current = false;
      unsubscribe();
    };
  }, [resolveProfile]);

  const refreshProfile = useCallback(async () => {
    await resolveProfile(getFirebaseAuth().currentUser);
  }, [resolveProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setStatus('signingIn');
    try {
      // Credential check happens server-side now - see apiClient.ts's
      // login(), which already throws a correctly-messaged AuthError on
      // bad credentials. The custom token it returns is exchanged for a
      // real Firebase session here; onAuthStateChanged drives the rest
      // of the transition once that succeeds.
      const { customToken } = await login(email, password);
      await signInWithCustomToken(getFirebaseAuth(), customToken);
    } catch (cause) {
      const appError = cause instanceof AppError ? cause : new AuthError(authErrorMessage(cause), cause);
      setError(appError);
      setStatus('signedOut');
      throw appError;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, profile, error, signIn, signOut, refreshProfile }),
    [status, profile, error, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Maps failures from exchanging the backend-issued custom token for a
 * real Firebase session (signInWithCustomToken) - not password errors,
 * which apiClient.ts's login() already turns into a correctly-messaged
 * AuthError before this ever runs (see signIn above).
 */
function authErrorMessage(cause: unknown): string {
  const code = (cause as { code?: string } | undefined)?.code;
  switch (code) {
    case 'auth/invalid-custom-token':
    case 'auth/custom-token-mismatch':
      return 'Could not sign in. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return normalizeError(cause).message || 'Could not sign in.';
  }
}
