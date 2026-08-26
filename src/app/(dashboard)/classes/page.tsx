'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';

import { AssignClassModal } from '@/components/AssignClassModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable, EMPTY_SELECTION, selectedIdsFrom } from '@/components/DataTable';
import { BanIcon, CheckCircleIcon, EditIcon, PlusIcon, TrashIcon, UsersIcon } from '@/components/Icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Modal } from '@/components/Modal';
import { SelectionBar } from '@/components/SelectionBar';
import { useToast } from '@/components/Toast';
import {
  createClass,
  deleteClass,
  getCurriculum,
  listClasses,
  listTeachers,
  updateClass,
  updateClassAssignments,
  updateClassStatus,
} from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import { MAX_GRADE, MIN_GRADE, type ClassAssignment, type SchoolAdminClass } from '@/lib/types';

export default function ClassesPage() {
  const state = useAsyncData(() => listClasses(), []);
  const teachersState = useAsyncData(() => listTeachers(), []);
  const curriculumState = useAsyncData(() => getCurriculum(), []);
  const { show } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<SchoolAdminClass | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [assigning, setAssigning] = useState<SchoolAdminClass | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SchoolAdminClass | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION);

  const classes = state.status === 'success' ? state.data : [];
  const selectedIds = selectedIdsFrom(selection, classes, (c) => c.id);

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
      await createClass({ grade: gradeNum, section });
      setCreateOpen(false);
      setGrade('');
      setSection('');
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      setFormError(normalizeError(cause).message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(schoolClass: SchoolAdminClass) {
    setEditTarget(schoolClass);
    setEditGrade(String(schoolClass.grade));
    setEditSection(schoolClass.section);
    setEditError(null);
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editTarget) return;
    const gradeNum = validGrade(editGrade);
    if (gradeNum === null) {
      setEditError(`Grade must be a whole number between ${MIN_GRADE} and ${MAX_GRADE}.`);
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateClass(editTarget.id, { grade: gradeNum, section: editSection });
      if (state.status === 'success') state.refetch();
      show('Class updated.', 'success');
      setEditTarget(null);
    } catch (cause) {
      setEditError(normalizeError(cause).message);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSaveAssignments(classId: string, assignments: ClassAssignment[]) {
    await updateClassAssignments(classId, assignments);
    if (state.status === 'success') state.refetch();
    show('Assignments updated.', 'success');
  }

  async function handleToggleStatus(schoolClass: SchoolAdminClass) {
    setBusyId(schoolClass.id);
    try {
      const next = schoolClass.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
      await updateClassStatus(schoolClass.id, next);
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
      await deleteClass(deleteTarget.id);
      show(`Class ${deleteTarget.grade} · ${deleteTarget.section} deleted.`, 'success');
      setDeleteTarget(null);
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleBulkDelete() {
    setBulkBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteClass(String(id))));
      show(`${selectedIds.length} class${selectedIds.length === 1 ? '' : 'es'} deleted.`, 'success');
      setSelection(EMPTY_SELECTION);
      setBulkDeleteOpen(false);
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkStatus(next: 'ACTIVE' | 'DEACTIVATED') {
    setBulkBusy(true);
    try {
      await Promise.all(selectedIds.map((id) => updateClassStatus(String(id), next)));
      show(`${selectedIds.length} class${selectedIds.length === 1 ? '' : 'es'} updated.`, 'success');
      setSelection(EMPTY_SELECTION);
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setBulkBusy(false);
    }
  }

  const columns: GridColDef<SchoolAdminClass>[] = [
    {
      field: 'grade',
      headerName: 'Class',
      width: 160,
      valueGetter: (_value, row) => `Class ${row.grade} · ${row.section}`,
    },
    { field: 'studentCount', headerName: 'Students', width: 110 },
    {
      field: 'assignments',
      headerName: 'Assignments',
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) =>
        row.assignments.length === 0
          ? 'None'
          : `${row.assignments.length} subject${row.assignments.length === 1 ? '' : 's'} assigned`,
    },
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
      width: 180,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Assign teachers/subjects">
            <IconButton size="small" onClick={() => setAssigning(params.row)}>
              <UsersIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)}>
              <EditIcon />
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
        <div>
          <span className="eyebrow">Roster</span>
          <h1>Classes</h1>
          <p className="lead">Create classes (grades 1–12) and see teacher/subject assignments at a glance.</p>
        </div>
        <button type="button" className="btn yellow" onClick={() => setCreateOpen(true)}>
          <PlusIcon /> Create class
        </button>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading classes" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && classes.length === 0 ? (
        <EmptyState
          title="No classes yet"
          message="Create your first class to start building the roster."
          actionLabel="Create class"
          onAction={() => setCreateOpen(true)}
        />
      ) : null}

      {state.status === 'success' && classes.length > 0 ? (
        <>
          <SelectionBar count={selectedIds.length}>
            <button type="button" className="btn white sm" disabled={bulkBusy} onClick={() => void handleBulkStatus('ACTIVE')}>
              <CheckCircleIcon /> Activate
            </button>
            <button type="button" className="btn white sm" disabled={bulkBusy} onClick={() => void handleBulkStatus('DEACTIVATED')}>
              <BanIcon /> Deactivate
            </button>
            <button type="button" className="btn danger sm" disabled={bulkBusy} onClick={() => setBulkDeleteOpen(true)}>
              <TrashIcon /> Delete
            </button>
          </SelectionBar>

          <DataTable
            rows={classes}
            columns={columns}
            checkboxSelection
            selectionModel={selection}
            onSelectionModelChange={setSelection}
          />
        </>
      ) : null}

      <Modal open={createOpen} title="Create class" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-row-inline">
            <div className="form-row">
              <label htmlFor="class-grade">Grade (1–12)</label>
              <input
                id="class-grade"
                type="number"
                min={MIN_GRADE}
                max={MAX_GRADE}
                className="field"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="class-section">Section</label>
              <input
                id="class-section"
                className="field"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
              />
            </div>
          </div>
          {formError ? <p style={{ color: 'var(--color-red)' }}>{formError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn yellow" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create class'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editTarget !== null} title="Edit class" onClose={() => setEditTarget(null)}>
        <form onSubmit={handleEditSubmit}>
          <div className="form-row-inline">
            <div className="form-row">
              <label htmlFor="edit-class-grade">Grade (1–12)</label>
              <input
                id="edit-class-grade"
                type="number"
                min={MIN_GRADE}
                max={MAX_GRADE}
                className="field"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="edit-class-section">Section</label>
              <input
                id="edit-class-section"
                className="field"
                value={editSection}
                onChange={(e) => setEditSection(e.target.value)}
                required
              />
            </div>
          </div>
          {editError ? <p style={{ color: 'var(--color-red)' }}>{editError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={() => setEditTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn dark" disabled={editSubmitting}>
              {editSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <AssignClassModal
        open={assigning !== null}
        schoolClass={assigning}
        teachers={teachersState.status === 'success' ? teachersState.data : []}
        subjects={curriculumState.status === 'success' ? curriculumState.data.subjects : []}
        onSave={handleSaveAssignments}
        onClose={() => setAssigning(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete class?"
        message={
          deleteTarget
            ? `This permanently deletes Class ${deleteTarget.grade} · ${deleteTarget.section}. This can't be undone - deactivate instead if you just want to hide it temporarily.`
            : ''
        }
        confirmLabel="Delete permanently"
        danger
        busy={deleteBusy}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.length} classes?`}
        message="This permanently deletes every selected class. This can't be undone."
        confirmLabel="Delete permanently"
        danger
        busy={bulkBusy}
        onConfirm={() => void handleBulkDelete()}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
