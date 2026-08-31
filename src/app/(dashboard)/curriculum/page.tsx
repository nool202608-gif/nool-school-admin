'use client';

import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { ErrorState, LoadingState } from '@/components/states';
import { getCurriculum } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SubjectToggle } from '@/lib/types';

const columns: GridColDef<SubjectToggle>[] = [
  { field: 'name', headerName: 'Subject', flex: 1, minWidth: 220 },
  {
    field: 'enabled',
    headerName: 'Assigned',
    width: 120,
    sortable: false,
    renderCell: (params) => <span className={`tag ${params.row.enabled ? 'green' : 'red'}`}>{params.row.enabled ? 'Yes' : 'No'}</span>,
  },
];

/**
 * Read-only - assigning subjects to a school is exclusively Super Admin's
 * job now (their global catalog page, or the per-Class Subjects toggle on
 * a school's own Classes page). This page used to let School Admin toggle
 * subjects on/off directly; that write path was removed on the backend
 * too (see nool-core's school_admin.py - PUT /curriculum no longer
 * exists), not just hidden here.
 */
export default function CurriculumPage() {
  const state = useAsyncData('curriculum', () => getCurriculum());

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-row">
          <h1>Subjects</h1>
        </div>
        <p className="lead">
          The subjects assigned to this school - this scopes what teachers see in their own curriculum
          pickers. Assignment is managed by your platform admin, not here - if one you need isn&apos;t
          listed as assigned yet, ask them.
        </p>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading curriculum" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? <DataTable rows={state.data.subjects} columns={columns} /> : null}
    </div>
  );
}
