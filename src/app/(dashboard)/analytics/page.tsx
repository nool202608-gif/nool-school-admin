'use client';

import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { ErrorState, LoadingState } from '@/components/states';
import { getAnalytics } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { ClassBreakdown } from '@/lib/types';

const BLOOM_LABEL: Record<string, string> = {
  REMEMBER: 'Remember',
  UNDERSTAND: 'Understand',
  APPLY: 'Apply',
  ANALYZE: 'Analyze',
  EVALUATE: 'Evaluate',
  CREATE: 'Create',
};

const columns: GridColDef<ClassBreakdown>[] = [
  { field: 'label', headerName: 'Class', flex: 1, minWidth: 160 },
  {
    field: 'masteryAvgPercent',
    headerName: 'Mastery average',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => `${row.masteryAvgPercent}%`,
  },
  {
    field: 'improvementPercent',
    headerName: 'Improvement',
    flex: 1,
    minWidth: 140,
    valueGetter: (_value, row) => (row.improvementPercent >= 0 ? `+${row.improvementPercent}` : row.improvementPercent),
  },
];

export default function AnalyticsPage() {
  const state = useAsyncData(() => getAnalytics(), []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Analytics</span>
          <h1>School performance</h1>
          <p className="lead">Mastery and improvement across every class at this school.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading analytics" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? (
        <>
          <div className="stats-grid">
            <div className="stat">
              <small>School mastery average</small>
              <strong>{state.data.schoolMasteryAvgPercent}%</strong>
            </div>
            <div className="stat">
              <small>Classes tracked</small>
              <strong>{state.data.classBreakdown.length}</strong>
            </div>
          </div>

          <div className="section-head" style={{ marginBottom: 12 }}>
            <h3>Bloom&apos;s level averages</h3>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            {state.data.bloomAverages.map((score) => (
              <div key={score.level} className="metric">
                <div className="metric-head">
                  <span>{BLOOM_LABEL[score.level] ?? score.level}</span>
                  <span>{score.percent === null ? 'Not assessed' : `${score.percent}%`}</span>
                </div>
                <div className="metric-line">
                  {score.percent !== null ? <b style={{ width: `${score.percent}%` }} /> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="section-head" style={{ marginBottom: 12 }}>
            <h3>By class</h3>
          </div>
          <DataTable rows={state.data.classBreakdown} columns={columns} getRowId={(row) => row.classId} />
        </>
      ) : null}
    </div>
  );
}
