'use client';

import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { listSchoolVoiceTests } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SchoolVoiceTest, TestStatus } from '@/lib/types';

const PAGE_SIZE = 20;

function statusTagVariant(status: TestStatus): string {
  if (status === 'RESULTS_READY' || status === 'COMPLETED') return 'green';
  if (status === 'DRAFT') return 'red';
  return 'yellow';
}

const columns: GridColDef<SchoolVoiceTest>[] = [
  { field: 'classLabel', headerName: 'Class', flex: 1, minWidth: 140 },
  { field: 'subjectName', headerName: 'Subject', flex: 1, minWidth: 140 },
  {
    field: 'teacherName',
    headerName: 'Teacher',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.teacherName ?? '—',
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 160,
    renderCell: (params) => <span className={`tag ${statusTagVariant(params.row.status)}`}>{params.row.status}</span>,
  },
  { field: 'assignedCount', headerName: 'Assigned', width: 100 },
  { field: 'completedCount', headerName: 'Completed', width: 110 },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 130,
    valueGetter: (_value, row) => new Date(row.createdAt).toLocaleDateString(),
  },
];

export default function SchoolTestsPage() {
  const [offset, setOffset] = useState(0);
  const state = useAsyncData(() => listSchoolVoiceTests({ limit: PAGE_SIZE, offset }), [offset]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Activity</span>
          <h1>Voice Tests</h1>
          <p className="lead">Every Test created across the school, by any teacher.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading tests" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && state.data.items.length === 0 ? (
        <EmptyState title="No Tests yet" message="Tests created by teachers across the school will show up here." />
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
