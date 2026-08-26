'use client';

import { useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { listSchoolQuestionPapers } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { QuestionPaperStatus, SchoolQuestionPaper } from '@/lib/types';

const PAGE_SIZE = 20;

function statusTagVariant(status: QuestionPaperStatus): string {
  if (status === 'FINALIZED') return 'green';
  if (status === 'VALIDATION_FAILED') return 'red';
  return 'yellow';
}

const columns: GridColDef<SchoolQuestionPaper>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
  { field: 'examType', headerName: 'Exam type', width: 130 },
  { field: 'subjectName', headerName: 'Subject', width: 140 },
  { field: 'createdByName', headerName: 'Created by', width: 160 },
  {
    field: 'status',
    headerName: 'Status',
    width: 160,
    renderCell: (params) => <span className={`tag ${statusTagVariant(params.row.status)}`}>{params.row.status}</span>,
  },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 130,
    valueGetter: (_value, row) => new Date(row.createdAt).toLocaleDateString(),
  },
];

export default function SchoolQuestionPapersPage() {
  const [offset, setOffset] = useState(0);
  const state = useAsyncData(() => listSchoolQuestionPapers({ limit: PAGE_SIZE, offset }), [offset]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Activity</span>
          <h1>Question Papers</h1>
          <p className="lead">Question Papers created across the school, by any teacher.</p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading question papers" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && state.data.items.length === 0 ? (
        <EmptyState
          title="No Question Papers yet"
          message="Question Papers created by teachers across the school will show up here."
        />
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
