'use client';

import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { listClasses, listSchoolImprovement, listSchoolRetestProgress } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';
import { useUrlPaginationModel, useUrlParam } from '@/lib/useUrlState';
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
  const [classFilter, setClassFilter] = useUrlParam('classId', '');
  const [progressPage, setProgressPage] = useUrlPaginationModel(PAGE_SIZE, 'progress');
  const [improvementPage, setImprovementPage] = useUrlPaginationModel(PAGE_SIZE, 'improvement');
  const classesState = useAsyncData('classes', () => listClasses());

  const progress = useAsyncData(
    `retest-progress:${classFilter}:${progressPage.page}:${progressPage.pageSize}`,
    () =>
      listSchoolRetestProgress({
        classId: classFilter || undefined,
        limit: progressPage.pageSize,
        offset: progressPage.page * progressPage.pageSize,
      }),
  );
  const improvement = useAsyncData(
    `improvement:${classFilter}:${improvementPage.page}:${improvementPage.pageSize}`,
    () =>
      listSchoolImprovement({
        classId: classFilter || undefined,
        limit: improvementPage.pageSize,
        offset: improvementPage.page * improvementPage.pageSize,
      }),
  );
  const classes = classesState.status === 'success' ? classesState.data : [];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-row">
          <h1>Retests &amp; Improvement</h1>
        </div>
        <p className="lead">
          How students are progressing through gap-topic Homework and Retests, across the whole school.
        </p>
      </div>

      <div className="table-toolbar">
        <select
          className="field"
          style={{ maxWidth: 240 }}
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setProgressPage({ page: 0, pageSize: PAGE_SIZE });
            setImprovementPage({ page: 0, pageSize: PAGE_SIZE });
          }}
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Class {c.grade} · {c.section}
            </option>
          ))}
        </select>
      </div>

      <h2 style={{ marginTop: 8, marginBottom: 8 }}>Retest progress</h2>
      {progress.status === 'loading' ? <LoadingState label="Loading retest progress" /> : null}
      {progress.status === 'error' ? <ErrorState onRetry={progress.retry} /> : null}
      {progress.status === 'success' && progress.data.items.length === 0 ? (
        <EmptyState title="No Retests yet" message="Retest progress for assigned Homework will show up here." />
      ) : null}
      {progress.status === 'success' && progress.data.items.length > 0 ? (
        <DataTable
          rows={progress.data.items}
          columns={progressColumns}
          getRowId={(row) => row.homeworkId}
          server
          rowCount={progress.data.total}
          paginationModel={progressPage}
          onPaginationModelChange={setProgressPage}
        />
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
        <DataTable
          rows={improvement.data.items}
          columns={improvementColumns}
          getRowId={(row) => row.homeworkId}
          server
          rowCount={improvement.data.total}
          paginationModel={improvementPage}
          onPaginationModelChange={setImprovementPage}
        />
      ) : null}
    </div>
  );
}
