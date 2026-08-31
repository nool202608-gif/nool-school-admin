'use client';

import { useEffect, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { DownloadIcon, SearchIcon, UploadIcon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useToast } from '@/components/Toast';
import {
  bulkImportCustomQuestions,
  createCustomQuestion,
  deleteCustomQuestion,
  getCustomQuestion,
  listChapters,
  listClasses,
  listCustomQuestionCollections,
  listSchoolQuestionBank,
  listSubjects,
  listTopics,
  updateCustomQuestion,
} from '@/lib/api';
import { normalizeError } from '@/lib/errors';
import { useAsyncData } from '@/lib/useAsyncData';
import { useUrlPaginationModel, useUrlParam } from '@/lib/useUrlState';
import {
  BLOOM_LEVELS,
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPES,
  type BloomLevel,
  type BulkImportResult,
  type Chapter,
  type CustomQuestion,
  type QuestionBankSource,
  type QuestionType,
  type SchoolAdminClass,
  type SchoolQuestionBankEntry,
  type Subject,
  type Topic,
} from '@/lib/types';

const PAGE_SIZE = 25;

// Sentinel for "no named set" as a <select> option value - distinct from
// '' which means "don't filter by collection at all" throughout this page.
const GENERAL_BANK_FILTER = '__general__';

const BLOOM_LABEL: Record<string, string> = {
  REMEMBER: 'Remember',
  UNDERSTAND: 'Understand',
  APPLY: 'Apply',
  ANALYZE: 'Analyze',
  EVALUATE: 'Evaluate',
  CREATE: 'Create',
};

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  MCQ: 'Multiple choice',
  SHORT_ANSWER: 'Short answer',
  LONG_ANSWER: 'Long answer',
  TRUE_FALSE: 'True / False',
};

function sourceTagVariant(source: QuestionBankSource): string {
  if (source === 'QUESTION_PAPER') return 'purple';
  if (source === 'CUSTOM') return 'green';
  return 'yellow';
}

function sourceLabel(source: QuestionBankSource): string {
  if (source === 'QUESTION_PAPER') return 'Question Paper';
  if (source === 'CUSTOM') return 'Custom';
  return 'Homework';
}

function classLabel(c: SchoolAdminClass): string {
  return `Class ${c.grade} · ${c.section}`;
}

// Whole hierarchy is School -> Class -> Section: a "Class" is a grade
// (e.g. "Class 10"), a "Section" is one specific grade+section (e.g.
// "Class 10 · A"). A question is assigned to exactly one of the two -
// scope picks which, so common content doesn't need duplicating once per
// section within the same class.
type AssignmentScope = 'section' | 'class';

interface QuestionFormState {
  scope: AssignmentScope;
  classId: string;
  grade: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  bloomLevel: BloomLevel | '';
  questionType: QuestionType | '';
  text: string;
  optionsText: string;
  answer: string;
  collectionName: string;
}

const EMPTY_FORM: QuestionFormState = {
  scope: 'section',
  classId: '',
  grade: '',
  subjectId: '',
  chapterId: '',
  topicId: '',
  bloomLevel: '',
  questionType: '',
  text: '',
  optionsText: '',
  answer: '',
  collectionName: '',
};

export default function QuestionBankPage() {
  const [source, setSource] = useUrlParam('source', '');
  const [topic, setTopic] = useUrlParam('topic', '');
  const [collectionFilter, setCollectionFilter] = useUrlParam('collection', '');
  const [paginationModel, setPaginationModel] = useUrlPaginationModel(PAGE_SIZE);
  const [topicInput, setTopicInput] = useState(topic);
  const { show } = useToast();

  const collectionsState = useAsyncData('custom-question-collections', () => listCustomQuestionCollections());
  const collections = collectionsState.status === 'success' ? collectionsState.data : [];

  useEffect(() => {
    const handle = setTimeout(() => {
      if (topicInput !== topic) {
        setTopic(topicInput);
        setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the debounced input value itself changes.
  }, [topicInput]);

  const state = useAsyncData(
    `question-bank:${source}:${topic}:${collectionFilter}:${paginationModel.page}:${paginationModel.pageSize}`,
    () =>
      listSchoolQuestionBank({
        source: (source || undefined) as QuestionBankSource | undefined,
        topic: topic || undefined,
        collectionName: collectionFilter && collectionFilter !== GENERAL_BANK_FILTER ? collectionFilter : undefined,
        generalBankOnly: collectionFilter === GENERAL_BANK_FILTER ? true : undefined,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
      }),
  );

  const classesState = useAsyncData('classes-for-questions', () => listClasses());
  const subjectsState = useAsyncData('subjects-for-questions', () => listSubjects());
  const classes = classesState.status === 'success' ? classesState.data : [];
  const subjects = subjectsState.status === 'success' ? subjectsState.data : [];
  // Only grades that already have at least one Section at this school -
  // a Class here is never something School Admin invents from scratch,
  // just a grouping level over Sections that already exist.
  const gradesWithSections = Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => a - b);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormState>(EMPTY_FORM);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [formBusy, setFormBusy] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SchoolQuestionBankEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  async function loadChaptersFor(subjectId: string) {
    if (!subjectId) {
      setChapters([]);
      return;
    }
    try {
      setChapters(await listChapters(subjectId));
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    }
  }

  async function loadTopicsFor(chapterId: string) {
    if (!chapterId) {
      setTopics([]);
      return;
    }
    try {
      setTopics(await listTopics(chapterId));
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setChapters([]);
    setTopics([]);
    setFormOpen(true);
  }

  async function openEdit(entry: SchoolQuestionBankEntry) {
    setFormOpen(true);
    setFormLoading(true);
    try {
      const question: CustomQuestion = await getCustomQuestion(entry.id);
      setEditingId(question.id);
      setForm({
        scope: question.classId ? 'section' : 'class',
        classId: question.classId ?? '',
        grade: question.grade !== null ? String(question.grade) : '',
        subjectId: question.subjectId,
        chapterId: question.chapterId,
        topicId: question.topicId ?? '',
        bloomLevel: question.bloomLevel,
        questionType: question.questionType,
        text: question.text,
        optionsText: (question.options ?? []).join('\n'),
        answer: question.answer,
        collectionName: question.collectionName ?? '',
      });
      await loadChaptersFor(question.subjectId);
      await loadTopicsFor(question.chapterId);
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
      setFormOpen(false);
    } finally {
      setFormLoading(false);
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  const isChoiceType = form.questionType !== '' && CHOICE_QUESTION_TYPES.includes(form.questionType);

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.bloomLevel || !form.questionType) return;
    if (form.scope === 'section' && !form.classId) return;
    if (form.scope === 'class' && !form.grade) return;
    setFormBusy(true);
    try {
      const options = isChoiceType
        ? form.optionsText
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean)
        : null;
      const payload = {
        classId: form.scope === 'section' ? form.classId : null,
        grade: form.scope === 'class' ? Number(form.grade) : null,
        subjectId: form.subjectId,
        chapterId: form.chapterId,
        topicId: form.topicId || null,
        bloomLevel: form.bloomLevel,
        questionType: form.questionType,
        text: form.text,
        options,
        answer: form.answer,
        collectionName: form.collectionName.trim() || null,
      };
      if (editingId) {
        await updateCustomQuestion(editingId, payload);
        show('Question updated.', 'success');
      } else {
        await createCustomQuestion(payload);
        show('Question added.', 'success');
      }
      closeForm();
      if (state.status === 'success') state.refetch();
      if (collectionsState.status === 'success') collectionsState.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteCustomQuestion(deleteTarget.id);
      show('Question deleted.', 'success');
      setDeleteTarget(null);
      if (state.status === 'success') state.refetch();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: GridColDef<SchoolQuestionBankEntry>[] = [
    { field: 'text', headerName: 'Question', flex: 2, minWidth: 260 },
    { field: 'topicLabel', headerName: 'Topic', flex: 1, minWidth: 160 },
    { field: 'subjectName', headerName: 'Subject', width: 140 },
    {
      field: 'bloomLevel',
      headerName: "Bloom's level",
      width: 130,
      valueGetter: (_value, row) => BLOOM_LABEL[row.bloomLevel] ?? row.bloomLevel,
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 130,
      renderCell: (params) => (
        <span className={`tag ${sourceTagVariant(params.row.source)}`}>{sourceLabel(params.row.source)}</span>
      ),
    },
    { field: 'sourceName', headerName: 'From', flex: 1, minWidth: 160 },
    {
      field: 'collectionName',
      headerName: 'Set',
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) =>
        row.source === 'CUSTOM' ? row.collectionName ?? 'School question bank' : '—',
    },
    {
      field: 'answer',
      headerName: 'Answer',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => row.answer ?? '—',
    },
    {
      field: 'actions',
      headerName: '',
      width: 130,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params) =>
        params.row.source === 'CUSTOM' ? (
          <div className="table-actions">
            <button type="button" className="btn white sm" onClick={() => void openEdit(params.row)}>
              Edit
            </button>
            <button type="button" className="btn white sm" onClick={() => setDeleteTarget(params.row)}>
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-row">
          <h1>Question bank</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn white" onClick={() => setImportOpen(true)}>
              <UploadIcon /> Bulk import
            </button>
            <button type="button" className="btn yellow" onClick={openCreate}>
              + Add question
            </button>
          </div>
        </div>
        <p className="lead">
          Every question your teachers have generated, plus any you&apos;ve added yourself - pulled from
          Question Papers, Homework, and your own custom questions, grouped by topic. New custom questions go
          straight into the school question bank unless you name a set for them.
        </p>
      </div>

      <div className="table-toolbar">
        <div className="search-field" style={{ maxWidth: 280 }}>
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by topic"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            aria-label="Search by topic"
          />
        </div>
        <select
          className="field"
          style={{ maxWidth: 240 }}
          value={source}
          onChange={(e) => {
            setSource(e.target.value as QuestionBankSource | '');
            setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
          }}
        >
          <option value="">All sources</option>
          <option value="QUESTION_PAPER">Question Papers</option>
          <option value="HOMEWORK">Homework</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <select
          className="field"
          style={{ maxWidth: 240 }}
          value={collectionFilter}
          onChange={(e) => {
            setCollectionFilter(e.target.value);
            setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
          }}
        >
          <option value="">All sets</option>
          <option value={GENERAL_BANK_FILTER}>School question bank (no set)</option>
          {collections.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {state.status === 'loading' ? <LoadingState label="Loading question bank" /> : null}
      {state.status === 'error' ? <ErrorState onRetry={state.retry} /> : null}

      {state.status === 'success' && state.data.items.length === 0 ? (
        <EmptyState
          title="No questions yet"
          message="Once teachers generate Question Papers or Homework - or you add your own - every question shows up here."
          actionLabel="Add question"
          onAction={openCreate}
        />
      ) : null}

      {state.status === 'success' && state.data.items.length > 0 ? (
        <DataTable
          rows={state.data.items}
          columns={columns}
          server
          rowCount={state.data.total}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
        />
      ) : null}

      <Modal open={formOpen} title={editingId ? 'Edit question' : 'Add question'} onClose={closeForm}>
        {formLoading ? (
          <LoadingState label="Loading question" />
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="form-row">
              <label>Applies to</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="radio"
                    name="q-scope"
                    checked={form.scope === 'section'}
                    onChange={() => setForm((f) => ({ ...f, scope: 'section', grade: '' }))}
                  />
                  One section
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
                  <input
                    type="radio"
                    name="q-scope"
                    checked={form.scope === 'class'}
                    onChange={() => setForm((f) => ({ ...f, scope: 'class', classId: '' }))}
                  />
                  A whole class (every section)
                </label>
              </div>
            </div>

            <div className="form-row-inline">
              {form.scope === 'section' ? (
                <div className="form-row">
                  <label htmlFor="q-class">Section</label>
                  <select
                    id="q-class"
                    className="field"
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Select a section
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {classLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-row">
                  <label htmlFor="q-grade">Class</label>
                  <select
                    id="q-grade"
                    className="field"
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Select a class
                    </option>
                    {gradesWithSections.map((grade) => (
                      <option key={grade} value={grade}>
                        Class {grade}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <label htmlFor="q-bloom">Bloom&apos;s level</label>
                <select
                  id="q-bloom"
                  className="field"
                  value={form.bloomLevel}
                  onChange={(e) => setForm((f) => ({ ...f, bloomLevel: e.target.value as BloomLevel }))}
                  required
                >
                  <option value="" disabled>
                    Select a level
                  </option>
                  {BLOOM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {BLOOM_LABEL[level] ?? level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-inline">
              <div className="form-row">
                <label htmlFor="q-subject">Subject</label>
                <select
                  id="q-subject"
                  className="field"
                  value={form.subjectId}
                  onChange={(e) => {
                    const subjectId = e.target.value;
                    setForm((f) => ({ ...f, subjectId, chapterId: '', topicId: '' }));
                    setTopics([]);
                    void loadChaptersFor(subjectId);
                  }}
                  required
                >
                  <option value="" disabled>
                    Select a subject
                  </option>
                  {subjects.map((s: Subject) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="q-chapter">Chapter</label>
                <select
                  id="q-chapter"
                  className="field"
                  value={form.chapterId}
                  onChange={(e) => {
                    const chapterId = e.target.value;
                    setForm((f) => ({ ...f, chapterId, topicId: '' }));
                    void loadTopicsFor(chapterId);
                  }}
                  disabled={!form.subjectId}
                  required
                >
                  <option value="" disabled>
                    Select a chapter
                  </option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="q-topic">Topic (optional)</label>
                <select
                  id="q-topic"
                  className="field"
                  value={form.topicId}
                  onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
                  disabled={!form.chapterId}
                >
                  <option value="">No specific topic</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="q-type">Question type</label>
              <select
                id="q-type"
                className="field"
                value={form.questionType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, questionType: e.target.value as QuestionType, optionsText: '', answer: '' }))
                }
                required
              >
                <option value="" disabled>
                  Select a type
                </option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="q-text">Question text</label>
              <textarea
                id="q-text"
                className="field"
                rows={3}
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="q-collection">Add to a named set (optional)</label>
              <input
                id="q-collection"
                className="field"
                list="q-collection-options"
                value={form.collectionName}
                onChange={(e) => setForm((f) => ({ ...f, collectionName: e.target.value }))}
                placeholder="Leave blank for the school question bank"
              />
              <datalist id="q-collection-options">
                {collections.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {form.questionType === 'TRUE_FALSE' ? (
              <div className="form-row">
                <label htmlFor="q-answer-tf">Correct answer</label>
                <select
                  id="q-answer-tf"
                  className="field"
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, optionsText: 'True\nFalse', answer: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Select True or False
                  </option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            ) : null}

            {form.questionType === 'MCQ' ? (
              <>
                <div className="form-row">
                  <label htmlFor="q-options">Options (one per line)</label>
                  <textarea
                    id="q-options"
                    className="field"
                    rows={4}
                    value={form.optionsText}
                    onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="q-answer-mcq">Correct answer</label>
                  <select
                    id="q-answer-mcq"
                    className="field"
                    value={form.answer}
                    onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Select the correct option
                    </option>
                    {form.optionsText
                      .split('\n')
                      .map((o) => o.trim())
                      .filter(Boolean)
                      .map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            ) : null}

            {form.questionType === 'SHORT_ANSWER' || form.questionType === 'LONG_ANSWER' ? (
              <div className="form-row">
                <label htmlFor="q-answer-text">Reference answer</label>
                <textarea
                  id="q-answer-text"
                  className="field"
                  rows={form.questionType === 'LONG_ANSWER' ? 4 : 2}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  required
                />
              </div>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="btn white" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="btn dark" disabled={formBusy}>
                {formBusy ? 'Saving…' : editingId ? 'Save changes' : 'Add question'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <CustomQuestionImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          if (state.status === 'success') state.refetch();
          if (collectionsState.status === 'success') collectionsState.refetch();
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this question?"
        message={deleteTarget ? `"${deleteTarget.text}" will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function downloadTemplate() {
  const headers = [
    'grade', 'section', 'subject', 'chapter', 'topic', 'bloomLevel', 'questionType', 'text', 'options', 'answer',
    'collection',
  ];
  const example = [
    '10', 'A', 'Physics', 'Motion', '', 'REMEMBER', 'MCQ', 'What is velocity?', 'Speed|Distance|Time|Mass', 'Speed',
    '',
  ];
  const csv = [headers, example].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom-questions-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function CustomQuestionImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { show } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  function handleClose() {
    setFile(null);
    setResult(null);
    onClose();
  }

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    try {
      const imported = await bulkImportCustomQuestions(file);
      setResult(imported);
      if (imported.createdCount > 0) onImported();
    } catch (cause) {
      show(normalizeError(cause).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Bulk import custom questions" onClose={handleClose} wide>
      {!result ? (
        <>
          <button type="button" className="link-btn" style={{ marginBottom: 16 }} onClick={downloadTemplate}>
            <DownloadIcon /> Download CSV template
          </button>
          <div className="file-drop">
            <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p style={{ marginTop: 10 }}>
              Accepts .csv or .xlsx, up to 500 rows. grade/section/subject/chapter/topic are matched by name -
              options are pipe-separated (only for MCQ/TRUE_FALSE). Leave section blank to apply a row to every
              section in that class. Leave collection blank to add straight to the school question bank, or
              name a set to group these questions together.
            </p>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn white" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" className="btn yellow" disabled={!file || submitting} onClick={() => void handleUpload()}>
              <UploadIcon /> {submitting ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bulk-summary">
            <div className="stat">
              <small>Created</small>
              <strong style={{ color: 'var(--color-green)' }}>{result.createdCount}</strong>
            </div>
            <div className="stat">
              <small>Failed</small>
              <strong style={{ color: result.errorCount > 0 ? 'var(--color-red)' : undefined }}>
                {result.errorCount}
              </strong>
            </div>
          </div>
          <div className="bulk-results">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td>
                      {row.status === 'created' ? (
                        <span style={{ color: 'var(--color-green)' }}>Created</span>
                      ) : (
                        <span style={{ color: 'var(--color-red)' }}>{row.error ?? row.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn dark" onClick={handleClose}>
              Done
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
