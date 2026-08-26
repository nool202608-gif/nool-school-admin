'use client';

import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { listSchoolAuditLog } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SchoolAuditLogEntry } from '@/lib/types';

const PAGE_SIZE = 20;

function actionLabel(action: string): string {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

const columns: GridColDef<SchoolAuditLogEntry>[] = [
  { field: 'actorName', headerName: 'Actor', flex: 1, minWidth: 160 },
  {
    field: 'action',
    headerName: 'Action',
    flex: 1,
    minWidth: 200,
    valueGetter: (_value, row) => actionLabel(row.action),
  },
  {
    field: 'targetType',
    headerName: 'Target',
    flex: 1,
    minWidth: 180,
    valueGetter: (_value, row) => `${row.targetType} · ${row.targetId.slice(0, 8)}`,
  },
  {
    field: 'createdAt',
    headerName: 'When',
    width: 190,
    valueGetter: (_value, row) => new Date(row.createdAt).toLocaleString(),
  },
];

export default function SchoolAuditLogPage() {
  const [offset, setOffset] = useState(0);
  const state = useAsyncData(() => listSchoolAuditLog({ limit: PAGE_SIZE, offset }), [offset]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Activity</span>
          <h1>Activity log</h1>
          <p className="lead">Every change made by your school&apos;s own admin accounts.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading activity" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && state.data.items.length === 0 ? (
        <EmptyState title="No activity yet" message="Actions taken in this console will show up here." />
      ) : null}

      {state.status === 'success' && state.data.items.length > 0 ? (
        <>
          <DataTable rows={state.data.items} columns={columns} pageSize={PAGE_SIZE} />
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
