import Link from 'next/link';

import { CheckCircleIcon } from './Icon';

export interface OnboardingStep {
  label: string;
  description: string;
  href: string;
  done: boolean;
}

/** Shown on the dashboard until every step is done, then never again -
 * no dismiss button needed since it self-hides once the school is
 * actually set up. Steps are derived live from real counts (classes,
 * teachers, students, enabled subjects), not a stored "onboarding"
 * record, so it can never drift out of sync with reality. */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="onboarding-card">
      <div className="onboarding-head">
        <div>
          <h3>Get your school set up</h3>
          <p>A few things to do before your school is fully ready.</p>
        </div>
        <span className="onboarding-progress">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <div className="onboarding-steps">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} className={`onboarding-step${step.done ? ' done' : ''}`}>
            <span className="onboarding-check">
              {step.done ? <CheckCircleIcon /> : <span className="onboarding-dot" aria-hidden="true" />}
            </span>
            <span className="onboarding-step-text">
              <span className="onboarding-step-label">{step.label}</span>
              <span className="onboarding-step-desc">{step.description}</span>
            </span>
            <span className="onboarding-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
