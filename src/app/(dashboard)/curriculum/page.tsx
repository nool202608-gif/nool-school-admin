'use client';

import { useState } from 'react';
import Switch from '@mui/material/Switch';
import type { GridColDef } from '@mui/x-data-grid';

import { DataTable } from '@/components/DataTable';
import { PlusIcon } from '@/components/Icon';
import { ErrorState, LoadingState } from '@/components/states';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { createSubject, getCurriculum, updateCurriculum } from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import type { SubjectToggle } from '@/lib/types';

export default function CurriculumPage() {
  const state = useAsyncData(() => getCurriculum(), []);
  const { show } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleToggle(subjectId: string, currentlyEnabled: boolean) {
    if (state.status !== 'success') return;
    setSavingId(subjectId);
    const nextEnabledIds = state.data.subjects
      .filter((s) => (s.id === subjectId ? !currentlyEnabled : s.enabled))
      .map((s) => s.id);
    try {
      await updateCurriculum(nextEnabledIds);
      state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddSubject(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await createSubject({ name });
      setAddOpen(false);
      setName('');
      show('Subject added and enabled for this school.', 'success');
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      setFormError(normalizeError(cause).message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns: GridColDef<SubjectToggle>[] = [
    { field: 'name', headerName: 'Subject', flex: 1, minWidth: 220 },
    {
      field: 'enabled',
      headerName: 'Active',
      width: 120,
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
          <span className="eyebrow">Curriculum</span>
          <h1>Subjects</h1>
          <p className="lead">
            Choose which subjects apply at this school - this scopes what teachers see in their own
            curriculum pickers. Add a new subject if the one you need isn&apos;t in the list yet.
          </p>
        </div>
        <button type="button" className="btn yellow" onClick={() => setAddOpen(true)}>
          <PlusIcon /> New subject
        </button>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading curriculum" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' ? <DataTable rows={state.data.subjects} columns={columns} /> : null}

      <Modal open={addOpen} title="Add a subject" onClose={() => setAddOpen(false)}>
        <form onSubmit={handleAddSubject}>
          <div className="form-row">
            <label htmlFor="subject-name">Subject name</label>
            <input
              id="subject-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {formError ? <p style={{ color: 'var(--color-red)' }}>{formError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn yellow" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
