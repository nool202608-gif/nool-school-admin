'use client';

import { ErrorState, LoadingState } from '@/components/states';
import { getSubscription } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SubscriptionStatus } from '@/lib/types';

function statusTagVariant(status: SubscriptionStatus): string {
  if (status === 'ACTIVE') return 'green';
  if (status === 'TRIAL') return 'yellow';
  return 'red';
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 0 : Math.min(100, limit === 0 ? 100 : (used / limit) * 100);
  const isOver = !isUnlimited && used >= limit;

  return (
    <div className="usage-meter">
      <div className="usage-meter-head">
        <span className="usage-label">{label}</span>
        <span className="usage-value">{isUnlimited ? `${used} · Unlimited` : `${used} of ${limit}`}</span>
      </div>
      <div className="usage-meter-track">
        {isUnlimited ? null : (
          <div className={`usage-meter-fill${isOver ? ' over' : ''}`} style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const state = useAsyncData(() => getSubscription(), []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Billing</span>
          <h1>Subscription</h1>
          <p className="lead">
            Read-only - your plan is managed by noolAI. Contact your account team to make changes.
          </p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading subscription" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? (
        <>
          <div className="card" style={{ maxWidth: 420, marginBottom: 'var(--space-6)' }}>
            <div className="checkrow">
              <span style={{ color: 'var(--color-muted)' }}>Plan</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{state.data.planName}</span>
            </div>
            <div className="checkrow">
              <span style={{ color: 'var(--color-muted)' }}>Status</span>
              <span className={`tag ${statusTagVariant(state.data.status)}`} style={{ marginLeft: 'auto' }}>
                {state.data.status}
              </span>
            </div>
            <div className="checkrow">
              <span style={{ color: 'var(--color-muted)' }}>Renews</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                {new Date(state.data.renewsAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="card" style={{ maxWidth: 640 }}>
            <span className="eyebrow" style={{ marginBottom: 'var(--space-5)', display: 'block' }}>
              Plan usage
            </span>
            <div className="usage-grid">
              <UsageMeter label="Teachers" used={state.data.teacherCount} limit={state.data.teacherLimit} />
              <UsageMeter label="Students" used={state.data.studentCount} limit={state.data.studentLimit} />
              <UsageMeter label="Voice Tests" used={state.data.testCount} limit={state.data.testLimit} />
              <UsageMeter
                label="Question Papers"
                used={state.data.questionPaperCount}
                limit={state.data.questionPaperLimit}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
