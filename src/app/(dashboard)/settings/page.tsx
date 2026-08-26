'use client';

import { useEffect, useState } from 'react';
import { updatePassword } from 'firebase/auth';

import { ErrorState, LoadingState } from '@/components/states';
import { useToast } from '@/components/Toast';
import { getSchoolAdminMe, updateSchoolAdminMe } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';

export default function SettingsPage() {
  const state = useAsyncData(() => getSchoolAdminMe(), []);
  const { show } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'success') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing the editable draft from freshly-fetched data is the sync point this effect exists for.
      setDisplayName(state.data.displayName);
      setPhoneNumber(state.data.phoneNumber ?? '');
    }
  }, [state]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmitPassword = newPassword.length >= 8 && newPassword === confirmPassword && !passwordSubmitting;

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    try {
      await updateSchoolAdminMe({ displayName, phoneNumber: phoneNumber || undefined });
      show('Profile updated.', 'success');
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      setProfileError(normalizeError(cause).message);
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmitPassword) return;
    setPasswordSubmitting(true);
    setPasswordError(null);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error('You are no longer signed in - please sign in again.');
      }
      // No backend "acknowledge" call needed here (unlike the forced
      // first-login flow at /change-password) - that call only clears
      // must_change_password, which is already false by the time someone
      // reaches this page proactively.
      await updatePassword(user, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      show('Password updated.', 'success');
    } catch (cause) {
      setPasswordError(normalizeError(cause).message);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          <p className="lead">Your own profile and sign-in details for this console.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading your profile" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? (
        <div className="settings-grid">
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Profile</h3>
            <p className="lead" style={{ marginBottom: 16 }}>{state.data.schoolName}</p>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <label htmlFor="settings-name">Name</label>
                <input
                  id="settings-name"
                  className="field"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="settings-email">Email</label>
                <input id="settings-email" className="field" value={state.data.email} disabled />
              </div>
              <div className="form-row">
                <label htmlFor="settings-phone">Phone (optional)</label>
                <input
                  id="settings-phone"
                  className="field"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              {profileError ? <p style={{ color: 'var(--color-red)' }}>{profileError}</p> : null}
              <button type="submit" className="btn dark" disabled={profileSubmitting} style={{ marginTop: 8 }}>
                {profileSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Change password</h3>
            <p className="lead" style={{ marginBottom: 16 }}>
              Update the password you use to sign in to this console.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-row">
                <label htmlFor="settings-new-password">New password</label>
                <input
                  id="settings-new-password"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="settings-confirm-password">Confirm new password</label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {tooShort ? <p style={{ color: 'var(--color-red)' }}>Must be at least 8 characters.</p> : null}
              {mismatch ? <p style={{ color: 'var(--color-red)' }}>Passwords don&apos;t match.</p> : null}
              {passwordError ? <p style={{ color: 'var(--color-red)' }}>{passwordError}</p> : null}
              <button
                type="submit"
                className="btn dark"
                disabled={!canSubmitPassword}
                style={{ marginTop: 8 }}
              >
                {passwordSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
