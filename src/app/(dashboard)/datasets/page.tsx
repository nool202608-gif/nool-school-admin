'use client';

import { useState } from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import Switch from '@mui/material/Switch';

import { ErrorState, LoadingState } from '@/components/states';
import { listDatasets, updateDatasets } from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SchoolDataset } from '@/lib/types';

export default function DatasetsPage() {
  const state = useAsyncData(() => listDatasets(), []);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleToggle(datasetId: string, currentlyEnabled: boolean) {
    if (state.status !== 'success') return;
    setSavingId(datasetId);
    setSaveError(null);
    const nextEnabledIds = state.data
      .filter((d) => (d.id === datasetId ? !currentlyEnabled : d.enabled))
      .map((d) => d.id);
    try {
      await updateDatasets(nextEnabledIds);
      state.refetch();
    } catch (cause) {
      setSaveError(normalizeError(cause).message);
    } finally {
      setSavingId(null);
    }
  }

  const columns: GridColDef<SchoolDataset>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'questionCount', headerName: 'Questions', width: 120 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 280 },
    {
      field: 'enabled',
      headerName: 'Active',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Switch
          checked={params.row.enabled}
          disabled={savingId === params.row.id}
          onChange={() => handleToggle(params.row.id, params.row.enabled)}
        />
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">School</span>
          <h1>Datasets</h1>
          <p className="lead">
            Choose which question banks are available to teachers at this school. Dataset creation
            and editing is Super Admin&apos;s job (they&apos;re a shared, cross-school catalog) — this
            page only controls availability here.
          </p>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading datasets" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? (
        <div className="card" style={{ padding: 0 }}>
          {saveError ? (
            <p style={{ color: 'var(--color-red)', margin: '12px 16px 0' }}>{saveError}</p>
          ) : null}
          <DataGrid
            rows={state.data}
            columns={columns}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      ) : null}
    </div>
  );
}
