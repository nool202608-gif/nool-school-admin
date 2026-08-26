'use client';

import { DataGrid, type GridColDef, type GridRowId, type GridRowSelectionModel, type GridValidRowModel } from '@mui/x-data-grid';

/** DataGrid's selection model is include/exclude-relative, not a plain
 * id list - this resolves it against the current rows either way, so
 * callers (bulk delete/deactivate bars) can just work with an id array. */
export function selectedIdsFrom<T extends GridValidRowModel>(
  model: GridRowSelectionModel | undefined,
  rows: T[],
  getRowId: (row: T) => GridRowId,
): GridRowId[] {
  if (!model) return [];
  if (model.type === 'include') return Array.from(model.ids);
  return rows.map(getRowId).filter((id) => !model.ids.has(id));
}

export const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() };

/**
 * Shared MUI DataGrid wrapper - every roster/activity table in the app
 * renders through this so sort/filter/search/column controls (all built
 * into DataGrid's own toolbar via `showToolbar`) and the brand styling
 * (card chrome, row height, empty/loading treatment) stay identical
 * everywhere instead of being re-implemented per page.
 */
export function DataTable<T extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  loading = false,
  checkboxSelection = false,
  selectionModel,
  onSelectionModelChange,
  pageSize = 10,
  height,
}: {
  rows: T[];
  columns: GridColDef<T>[];
  getRowId?: (row: T) => string;
  loading?: boolean;
  checkboxSelection?: boolean;
  selectionModel?: GridRowSelectionModel;
  onSelectionModelChange?: (model: GridRowSelectionModel) => void;
  pageSize?: number;
  height?: number;
}) {
  return (
    <div className="table-wrap" style={{ padding: 0 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        showToolbar
        checkboxSelection={checkboxSelection}
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={onSelectionModelChange}
        disableRowSelectionOnClick
        {...(height ? { style: { height } } : { autoHeight: true })}
        initialState={{
          pagination: { paginationModel: { pageSize } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        density="comfortable"
      />
    </div>
  );
}
