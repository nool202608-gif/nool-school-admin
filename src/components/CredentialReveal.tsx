'use client';

import { useState } from 'react';

import { CopyButton } from './CopyButton';
import { MailIcon } from './Icon';
import { SendCredentialsEmailModal } from './SendCredentialsEmailModal';
import type { SendCredentialsEmailInput } from '@/lib/types';

/**
 * Shown once, immediately after a real Firebase account is provisioned
 * (see nool-core's src/services/user_provisioning.py) - there is no
 * automatic email step anywhere in this platform, so this panel is the
 * only place the temp password is ever visible. Nothing persists it in
 * plaintext after this render; `onSendEmail`, when provided, is the one
 * deliberate way it can leave this panel as an email the admin reviews
 * first (see SendCredentialsEmailModal).
 */
export function CredentialReveal({
  displayName,
  email,
  tempPassword,
  onSendEmail,
}: {
  displayName: string;
  email: string;
  tempPassword: string;
  onSendEmail?: (input: SendCredentialsEmailInput) => Promise<unknown>;
}) {
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <div className="credential-panel">
      <div className="credential-row">
        <div>
          <small>Name</small>
          {displayName}
        </div>
      </div>
      <div className="credential-row">
        <div>
          <small>Email</small>
          {email}
        </div>
        <CopyButton value={email} />
      </div>
      <div className="credential-row">
        <div>
          <small>Temporary password</small>
          <code>{tempPassword}</code>
        </div>
        <CopyButton value={tempPassword} />
      </div>
      <div className="credential-warning">
        <span>⚠</span>
        <span>
          This password won&apos;t be shown again. Share it with {displayName} now - they&apos;ll be
          required to set their own password the first time they sign in.
        </span>
      </div>
      {onSendEmail ? (
        <>
          <div className="modal-actions" style={{ marginTop: 'var(--space-5)', justifyContent: 'flex-start' }}>
            <button type="button" className="btn white sm" onClick={() => setEmailOpen(true)}>
              <MailIcon /> Send by email
            </button>
          </div>
          <SendCredentialsEmailModal
            open={emailOpen}
            displayName={displayName}
            email={email}
            tempPassword={tempPassword}
            onSend={onSendEmail}
            onClose={() => setEmailOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
