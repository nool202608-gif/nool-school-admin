'use client';

import { useEffect, useState } from 'react';

import { Modal } from './Modal';
import { normalizeError } from '@/lib/errors';
import type { ClassAssignment, SchoolAdminClass, SchoolTeacher, SubjectToggle } from '@/lib/types';

interface Row {
  teacherId: string;
  subjectId: string;
}

/**
 * Backs the literal "assign a class to teacher" ask - updateClassAssignments
 * already existed server-side (see nool-core's PUT /school/classes/{id}/assignments)
 * but had no UI. Subjects offered here are this school's *enabled*
 * curriculum only (see the Curriculum page) - assigning a disabled subject
 * would be a dead end for the teacher.
 */
export function AssignClassModal({
  open,
  schoolClass,
  teachers,
  subjects,
  onSave,
  onClose,
}: {
  open: boolean;
  schoolClass: SchoolAdminClass | null;
  teachers: SchoolTeacher[];
  subjects: SubjectToggle[];
  onSave: (classId: string, assignments: ClassAssignment[]) => Promise<unknown>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const enabledSubjects = subjects.filter((s) => s.enabled);

  useEffect(() => {
    if (schoolClass) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding local editable rows from the class prop whenever a different class is opened is the intended behavior, not a render-derived value.
      setRows(schoolClass.assignments.map((a) => ({ teacherId: a.teacherId, subjectId: a.subjectId })));
      setFormError(null);
    }
  }, [schoolClass]);

  if (!schoolClass) return null;
  const currentClass = schoolClass;

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { teacherId: teachers[0]?.id ?? '', subjectId: enabledSubjects[0]?.id ?? '' },
    ]);
  }

  async function handleSave() {
    setSubmitting(true);
    setFormError(null);
    try {
      const assignments = rows.filter((r) => r.teacherId && r.subjectId);
      await onSave(currentClass.id, assignments);
      onClose();
    } catch (cause) {
      setFormError(normalizeError(cause).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`Assign teachers - Class ${currentClass.grade} · ${currentClass.section}`}
      onClose={onClose}
      wide
    >
      {rows.length === 0 ? (
        <p style={{ marginBottom: 16 }}>No subjects assigned yet. Add a row to get started.</p>
      ) : (
        rows.map((row, index) => (
          <div key={index} className="assign-row">
            <select
              className="field"
              value={row.teacherId}
              onChange={(e) => updateRow(index, { teacherId: e.target.value })}
            >
              <option value="" disabled>
                Select teacher
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={row.subjectId}
              onChange={(e) => updateRow(index, { subjectId: e.target.value })}
            >
              <option value="" disabled>
                Select subject
              </option>
              {enabledSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="button" className="remove-row-btn" aria-label="Remove" onClick={() => removeRow(index)}>
              ✕
            </button>
          </div>
        ))
      )}

      <button type="button" className="add-row-btn" onClick={addRow} disabled={teachers.length === 0 || enabledSubjects.length === 0}>
        + Add teacher / subject
      </button>

      {formError ? <p style={{ color: 'var(--color-red)', marginTop: 12 }}>{formError}</p> : null}

      <div className="modal-actions">
        <button type="button" className="btn white" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn dark" disabled={submitting} onClick={() => void handleSave()}>
          {submitting ? 'Saving…' : 'Save assignments'}
        </button>
      </div>
    </Modal>
  );
}
