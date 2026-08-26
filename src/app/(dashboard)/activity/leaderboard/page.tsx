'use client';

import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { getSchoolLeaderboard } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SchoolLeaderboardEntry } from '@/lib/types';

const PAGE_SIZE = 20;

const columns: GridColDef<SchoolLeaderboardEntry>[] = [
  { field: 'rank', headerName: 'Rank', width: 90, valueGetter: (_value, row) => `#${row.rank}` },
  { field: 'displayName', headerName: 'Student', flex: 1, minWidth: 180 },
  { field: 'classLabel', headerName: 'Class', width: 140 },
  { field: 'points', headerName: 'Points', width: 110 },
];

export default function SchoolLeaderboardPage() {
  const [offset, setOffset] = useState(0);
  const state = useAsyncData(() => getSchoolLeaderboard({ limit: PAGE_SIZE, offset }), [offset]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Activity</span>
          <h1>Leaderboard</h1>
          <p className="lead">Every student in the school, ranked by points.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading leaderboard" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && state.data.items.length === 0 ? (
        <EmptyState title="No students yet" message="Once students earn points, the school-wide ranking will show up here." />
      ) : null}

      {state.status === 'success' && state.data.items.length > 0 ? (
        <>
          <DataTable
            rows={state.data.items}
            columns={columns}
            getRowId={(row) => row.studentId}
            pageSize={PAGE_SIZE}
          />
          <div className="table-toolbar" style={{ justifyContent: 'space-between' }}>
            <span className="lead">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, state.data.total)} of {state.data.total}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn white sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn white sm"
                disabled={offset + PAGE_SIZE >= state.data.total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
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
