'use client';

import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { listSchoolImprovement, listSchoolRetestProgress } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SchoolImprovement, SchoolRetestProgress } from '@/lib/types';

const PAGE_SIZE = 20;

const progressColumns: GridColDef<SchoolRetestProgress>[] = [
  { field: 'classLabel', headerName: 'Class', flex: 1, minWidth: 140 },
  {
    field: 'gapTopic',
    headerName: 'Gap topic',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.gapTopic || '—',
  },
  { field: 'assignedCount', headerName: 'Assigned', width: 100 },
  { field: 'completedCount', headerName: 'Completed', width: 110 },
  { field: 'inProgressCount', headerName: 'In progress', width: 110 },
  { field: 'notStartedCount', headerName: 'Not started', width: 110 },
];

const improvementColumns: GridColDef<SchoolImprovement>[] = [
  { field: 'classLabel', headerName: 'Class', flex: 1, minWidth: 140 },
  {
    field: 'gapTopic',
    headerName: 'Gap topic',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.gapTopic || '—',
  },
  { field: 'baselinePercent', headerName: 'Baseline', width: 100, valueGetter: (_value, row) => `${row.baselinePercent}%` },
  { field: 'retestPercent', headerName: 'Retest', width: 100, valueGetter: (_value, row) => `${row.retestPercent}%` },
  {
    field: 'improvementPercent',
    headerName: 'Improvement',
    width: 130,
    renderCell: (params) => (
      <span className={`tag ${params.row.improvementPercent >= 0 ? 'green' : 'red'}`}>
        {params.row.improvementPercent >= 0 ? '+' : ''}
        {params.row.improvementPercent}%
      </span>
    ),
  },
  {
    field: 'retestedCount',
    headerName: 'Retested',
    width: 110,
    valueGetter: (_value, row) => `${row.retestedCount}/${row.assignedCount}`,
  },
];

export default function SchoolRetestsPage() {
  const [progressOffset, setProgressOffset] = useState(0);
  const [improvementOffset, setImprovementOffset] = useState(0);

  const progress = useAsyncData(
    () => listSchoolRetestProgress({ limit: PAGE_SIZE, offset: progressOffset }),
    [progressOffset],
  );
  const improvement = useAsyncData(
    () => listSchoolImprovement({ limit: PAGE_SIZE, offset: improvementOffset }),
    [improvementOffset],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Activity</span>
          <h1>Retests &amp; Improvement</h1>
          <p className="lead">
            How students are progressing through gap-topic Homework and Retests, across the whole school.
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: 8, marginBottom: 8 }}>Retest progress</h2>
      {progress.status === 'loading' ? <LoadingState label="Loading retest progress" /> : null}
      {progress.status === 'error' ? <ErrorState onRetry={progress.retry} /> : null}
      {progress.status === 'success' && progress.data.items.length === 0 ? (
        <EmptyState title="No Retests yet" message="Retest progress for assigned Homework will show up here." />
      ) : null}
      {progress.status === 'success' && progress.data.items.length > 0 ? (
        <>
          <DataTable
            rows={progress.data.items}
            columns={progressColumns}
            getRowId={(row) => row.homeworkId}
            pageSize={PAGE_SIZE}
          />
          <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
            <span className="lead">
              {progressOffset + 1}–{Math.min(progressOffset + PAGE_SIZE, progress.data.total)} of{' '}
              {progress.data.total}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn white sm"
                disabled={progressOffset === 0}
                onClick={() => setProgressOffset(Math.max(0, progressOffset - PAGE_SIZE))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn white sm"
                disabled={progressOffset + PAGE_SIZE >= progress.data.total}
                onClick={() => setProgressOffset(progressOffset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}

      <h2 style={{ marginTop: 28, marginBottom: 8 }}>Improvement</h2>
      {improvement.status === 'loading' ? <LoadingState label="Loading improvement" /> : null}
      {improvement.status === 'error' ? <ErrorState onRetry={improvement.retry} /> : null}
      {improvement.status === 'success' && improvement.data.items.length === 0 ? (
        <EmptyState
          title="No improvement data yet"
          message="Baseline vs. retest comparisons will show up here once students complete Retests."
        />
      ) : null}
      {improvement.status === 'success' && improvement.data.items.length > 0 ? (
        <>
          <DataTable
            rows={improvement.data.items}
            columns={improvementColumns}
            getRowId={(row) => row.homeworkId}
            pageSize={PAGE_SIZE}
          />
          <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
            <span className="lead">
              {improvementOffset + 1}–{Math.min(improvementOffset + PAGE_SIZE, improvement.data.total)} of{' '}
              {improvement.data.total}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn white sm"
                disabled={improvementOffset === 0}
                onClick={() => setImprovementOffset(Math.max(0, improvementOffset - PAGE_SIZE))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn white sm"
                disabled={improvementOffset + PAGE_SIZE >= improvement.data.total}
                onClick={() => setImprovementOffset(improvementOffset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
