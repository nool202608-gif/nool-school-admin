'use client';

import { useState } from 'react';

import { Modal } from './Modal';
import { MailIcon } from './Icon';
import { normalizeError } from '@/lib/errors';
import type { SendCredentialsEmailInput } from '@/lib/types';

function defaultBody(displayName: string, email: string, tempPassword: string): string {
  return `Hi ${displayName},

An account has been created for you on noolAI. Here are your sign-in details:

Email: ${email}
Temporary password: ${tempPassword}

You'll be asked to set your own password the first time you sign in. If you weren't expecting this, please contact your school admin.

Thanks,
Your school`;
}

/**
 * Lets the admin review and edit the email before it goes out - the
 * backend never auto-sends on account creation (see CredentialReveal),
 * so this is the only path a temp password reaches a teacher/student by
 * email, and it's always a deliberate click.
 */
export function SendCredentialsEmailModal({
  open,
  displayName,
  email,
  tempPassword,
  onSend,
  onClose,
}: {
  open: boolean;
  displayName: string;
  email: string;
  tempPassword: string;
  onSend: (input: SendCredentialsEmailInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState('Your noolAI account is ready');
  const [message, setMessage] = useState(() => defaultBody(displayName, email, tempPassword));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleClose() {
    setError(null);
    setSent(false);
    onClose();
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await onSend({ subject, message, tempPassword });
      setSent(true);
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} title={`Send credentials to ${displayName}`} onClose={handleClose} wide>
      {sent ? (
        <>
          <p>
            Sent to <b>{email}</b>.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn dark" onClick={handleClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="form-row">
            <label htmlFor="email-to">To</label>
            <input id="email-to" className="field" value={email} disabled />
          </div>
          <div className="form-row">
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              className="field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="email-body">Message</label>
            <textarea
              id="email-body"
              className="field"
              rows={9}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {error ? <p style={{ color: 'var(--color-red)' }}>{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" className="btn yellow" disabled={sending} onClick={() => void handleSend()}>
              <MailIcon /> {sending ? 'Sending…' : 'Send email'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
