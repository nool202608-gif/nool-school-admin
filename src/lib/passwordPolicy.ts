/** Shared password-complexity policy for every password-entry form this
 * app controls (change-password's forced first-login flow, Settings' own
 * "change my password" form) - Firebase's own hosted "forgot password"
 * email-reset page is outside our control and isn't covered here.
 */

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRequirement {
  key: string;
  label: string;
  met: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { key: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { key: 'lower', label: 'A lowercase letter', met: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'An uppercase letter', met: (p) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'A number', met: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'A special character (e.g. !@#$%)', met: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export function unmetPasswordRequirements(password: string): PasswordRequirement[] {
  return PASSWORD_REQUIREMENTS.filter((r) => !r.met(password));
}

export function isPasswordValid(password: string): boolean {
  return unmetPasswordRequirements(password).length === 0;
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

/** 0-5 based on how many requirements are met, collapsed to a 5-band
 * label - not a real entropy estimate, just enough to nudge a stronger
 * choice than the bare minimum. */
export function passwordStrength(password: string): { metCount: number; label: PasswordStrength } {
  if (password.length === 0) return { metCount: 0, label: 'empty' };
  const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.met(password)).length;
  if (metCount <= 1) return { metCount, label: 'weak' };
  if (metCount <= 2) return { metCount, label: 'fair' };
  if (metCount <= 4) return { metCount, label: 'good' };
  return { metCount, label: 'strong' };
}
