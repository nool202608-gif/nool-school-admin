'use client';

import { useEffect, useState } from 'react';

import { ErrorState, LoadingState } from '@/components/states';
import { useToast } from '@/components/Toast';
import { getDefaultBloomDistribution, updateDefaultBloomDistribution } from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import { BLOOM_LEVELS, type BloomDistribution, type BloomLevel } from '@/lib/types';

const LEVEL_LABEL: Record<BloomLevel, string> = {
  REMEMBER: 'Remember',
  UNDERSTAND: 'Understand',
  APPLY: 'Apply',
  ANALYZE: 'Analyze',
  EVALUATE: 'Evaluate',
  CREATE: 'Create',
};

const FALLBACK_DISTRIBUTION: BloomDistribution = {
  REMEMBER: 20,
  UNDERSTAND: 20,
  APPLY: 20,
  ANALYZE: 20,
  EVALUATE: 10,
  CREATE: 10,
};

export default function QuestionDefaultsPage() {
  const state = useAsyncData(() => getDefaultBloomDistribution(), []);
  const { show } = useToast();

  const [values, setValues] = useState<Record<BloomLevel, string>>({} as Record<BloomLevel, string>);
  const [hasOverride, setHasOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const distribution = state.status === 'success' ? state.data.distribution : undefined;

  useEffect(() => {
    if (distribution === undefined) return;
    const source = distribution ?? FALLBACK_DISTRIBUTION;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing the editable draft from freshly-fetched data is the sync point this effect exists for.
    setHasOverride(distribution !== null);
    setValues(
      BLOOM_LEVELS.reduce(
        (acc, level) => ({ ...acc, [level]: String(source[level] ?? 0) }),
        {} as Record<BloomLevel, string>,
      ),
    );
  }, [distribution]);

  const sum = BLOOM_LEVELS.reduce((total, level) => total + (Number(values[level]) || 0), 0);
  const validSum = sum === 100;

  function handleChange(level: BloomLevel, value: string) {
    setValues((current) => ({ ...current, [level]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validSum) {
      setFormError(`Percentages must sum to 100 - currently ${sum}.`);
      return;
    }
    setSubmitting(true);
    try {
      const distribution: BloomDistribution = BLOOM_LEVELS.reduce(
        (acc, level) => ({ ...acc, [level]: Number(values[level]) || 0 }),
        {} as BloomDistribution,
      );
      await updateDefaultBloomDistribution(distribution);
      setHasOverride(true);
      show('Default question mix saved.', 'success');
    } catch (cause) {
      setFormError(normalizeError(cause).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">School</span>
          <h1>Question defaults</h1>
          <p className="lead">
            The default Bloom&apos;s-taxonomy mix new Question Papers and Homework start from at this
            school, unless a teacher picks their own for a specific one.
          </p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading question defaults" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? (
        <div className="card" style={{ maxWidth: 480 }}>
          {!hasOverride ? (
            <p style={{ color: 'var(--color-muted)', marginBottom: 16 }}>
              No override set yet - teachers currently see the system default. Save one below to set a
              school-wide default.
            </p>
          ) : null}
          <form onSubmit={handleSubmit}>
            {BLOOM_LEVELS.map((level) => (
              <div key={level} className="form-row-inline" style={{ alignItems: 'center' }}>
                <label htmlFor={`bloom-${level}`} style={{ flex: 1, marginBottom: 0 }}>
                  {LEVEL_LABEL[level]}
                </label>
                <input
                  id={`bloom-${level}`}
                  type="number"
                  min={0}
                  max={100}
                  className="field"
                  style={{ maxWidth: 100 }}
                  value={values[level] ?? ''}
                  onChange={(e) => handleChange(level, e.target.value)}
                />
                <span style={{ color: 'var(--color-muted)' }}>%</span>
              </div>
            ))}

            <div className="checkrow" style={{ marginTop: 4 }}>
              <span style={{ color: 'var(--color-muted)' }}>Total</span>
              <span
                style={{ marginLeft: 'auto', fontWeight: 600, color: validSum ? undefined : 'var(--color-red)' }}
              >
                {sum}%
              </span>
            </div>

            {formError ? <p style={{ color: 'var(--color-red)', marginTop: 12 }}>{formError}</p> : null}

            <div className="modal-actions" style={{ paddingTop: 16 }}>
              <button type="submit" className="btn dark" disabled={submitting || !validSum}>
                {submitting ? 'Saving…' : 'Save default mix'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
