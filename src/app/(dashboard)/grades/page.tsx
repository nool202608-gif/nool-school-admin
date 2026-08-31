'use client';

import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { BanIcon, BookIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@/components/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { createGrade, deleteGrade, getGradeSubjects, listGrades, updateGradeStatus, updateGradeSubjects } from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import { MAX_GRADE, MIN_GRADE, type SchoolGrade, type SubjectToggle } from '@/lib/types';

/** The "Class" level (e.g. "Class 10") - the parent every Section on the
 * Sections page belongs to. See SchoolGrade's doc comment in types.ts for
 * why this is a separate page/entity from Sections rather than the same
 * page renamed. */
export default function GradesPage() {
  const state = useAsyncData('grades', () => listGrades());
  const { show } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolGrade | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [subjectsTarget, setSubjectsTarget] = useState<SchoolGrade | null>(null);
  const [subjects, setSubjects] = useState<SubjectToggle[] | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null);

  const grades = state.status === 'success' ? state.data : [];

  useEffect(() => {
    if (!subjectsTarget) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this effect *is* the data fetch, triggered by opening the modal; resetting to loading is the intended behavior, not a render-derived value.
    setSubjectsLoading(true);
    setSubjectsError(null);
    getGradeSubjects(subjectsTarget.id)
      .then((result) => {
        if (!cancelled) setSubjects(result.subjects);
      })
      .catch((cause) => {
        if (!cancelled) setSubjectsError(normalizeError(cause).message);
      })
      .finally(() => {
        if (!cancelled) setSubjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectsTarget]);

  function closeSubjects() {
    setSubjectsTarget(null);
    setSubjects(null);
    setSubjectsError(null);
  }

  async function handleToggleSubject(subjectId: string, currentlyEnabled: boolean) {
    if (!subjectsTarget || !subjects) return;
    setSavingSubjectId(subjectId);
    const nextEnabledIds = subjects
      .filter((s) => (s.id === subjectId ? !currentlyEnabled : s.enabled))
      .map((s) => s.id);
    try {
      const result = await updateGradeSubjects(subjectsTarget.id, nextEnabledIds);
      setSubjects(result.subjects);
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setSavingSubjectId(null);
    }
  }

  function validGrade(value: string): number | null {
    const n = Number(value);
    if (!Number.isInteger(n) || n < MIN_GRADE || n > MAX_GRADE) return null;
    return n;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const gradeNum = validGrade(grade);
    if (gradeNum === null) {
      setFormError(`Grade must be a whole number between ${MIN_GRADE} and ${MAX_GRADE}.`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createGrade({ grade: gradeNum });
      setCreateOpen(false);
      setGrade('');
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      setFormError(normalizeError(cause).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(schoolGrade: SchoolGrade) {
    setBusyId(schoolGrade.id);
    try {
      const next = schoolGrade.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
      await updateGradeStatus(schoolGrade.id, next);
      if (state.status === 'success') state.refetch();
      show(next === 'ACTIVE' ? 'Class reactivated.' : 'Class deactivated.', 'success');
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteGrade(deleteTarget.id);
      show(`Class ${deleteTarget.grade} deleted.`, 'success');
      setDeleteTarget(null);
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: GridColDef<SchoolGrade>[] = [
    {
      field: 'grade',
      headerName: 'Class',
      width: 160,
      valueGetter: (_value, row) => `Class ${row.grade}`,
    },
    { field: 'sectionCount', headerName: 'Sections', width: 110 },
    { field: 'studentCount', headerName: 'Students', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <span className={`tag ${params.row.status === 'DEACTIVATED' ? 'red' : 'green'}`}>{params.row.status}</span>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 150,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Subjects">
            <IconButton size="small" onClick={() => setSubjectsTarget(params.row)}>
              <BookIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status === 'DEACTIVATED' ? 'Activate' : 'Deactivate'}>
            <IconButton size="small" disabled={busyId === params.row.id} onClick={() => handleToggleStatus(params.row)}>
              {params.row.status === 'DEACTIVATED' ? <CheckCircleIcon /> : <BanIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteTarget(params.row)} sx={{ color: 'var(--color-red)' }}>
              <TrashIcon />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-row">
          <h1>Classes</h1>
          <button type="button" className="btn yellow" onClick={() => setCreateOpen(true)}>
            <PlusIcon /> Add class
          </button>
        </div>
        <p className="lead">
          The grade level (grades 1–12) that Sections belong to - see the Sections page to add A/B/C
          sections within a Class.
        </p>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading classes" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && grades.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Add your first Class, then add sections to it from the Sections page."
          actionLabel="Add class"
          onAction={() => setCreateOpen(true)}
        />
      ) : null}

      {state.status === 'success' && grades.length > 0 ? (
        <DataTable rows={grades} columns={columns} />
      ) : null}

      <Modal open={createOpen} title="Add class" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <label htmlFor="grade-number">Grade (1–12)</label>
            <input
              id="grade-number"
              type="number"
              min={MIN_GRADE}
              max={MAX_GRADE}
              className="field"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />
          </div>
          {formError ? <p style={{ color: 'var(--color-red)' }}>{formError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn yellow" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add class'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={subjectsTarget !== null}
        title={subjectsTarget ? `Subjects · Class ${subjectsTarget.grade}` : 'Subjects'}
        onClose={closeSubjects}
      >
        {subjectsLoading ? <LoadingState label="Loading subjects" /> : null}
        {subjectsError ? <ErrorState onRetry={() => setSubjectsTarget(subjectsTarget)} /> : null}
        {!subjectsLoading && !subjectsError && subjects ? (
          subjects.length === 0 ? (
            <p style={{ color: 'var(--color-muted)' }}>
              No subjects in the catalog yet - ask your platform admin to add one.
            </p>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="checkrow">
                <span>{subject.name}</span>
                <Switch
                  style={{ marginLeft: 'auto' }}
                  checked={subject.enabled}
                  disabled={savingSubjectId === subject.id}
                  onChange={() => handleToggleSubject(subject.id, subject.enabled)}
                />
              </div>
            ))
          )
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn dark" onClick={closeSubjects}>
            Done
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete class?"
        message={
          deleteTarget
            ? `This permanently deletes Class ${deleteTarget.grade}. This can't be undone - it must have no sections left, and deactivating instead just hides it.`
            : ''
        }
        confirmLabel="Delete permanently"
        danger
        busy={deleteBusy}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
