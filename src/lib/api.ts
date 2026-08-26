import { apiDownload, apiRequest, apiRequestList, apiUpload } from './apiClient';
import type {
  BloomDistribution,
  BloomDistributionResult,
  BulkImportResult,
  ClassAssignment,
  CreateClassInput,
  CreateStudentInput,
  CreateStudentResult,
  CreateSubjectInput,
  InviteTeacherInput,
  InviteTeacherResult,
  PageEnvelope,
  ResetPasswordResult,
  SchoolAdminClass,
  SchoolAdminMe,
  SchoolAnalytics,
  SchoolAuditLogEntry,
  SchoolCurriculum,
  SchoolDataset,
  SchoolHomework,
  SchoolImprovement,
  SchoolLeaderboardEntry,
  SchoolQuestionPaper,
  SchoolRetestProgress,
  SchoolStudent,
  SchoolSubscription,
  SchoolTeacher,
  SchoolVoiceTest,
  SendCredentialsEmailInput,
  SendCredentialsEmailResult,
  SubjectToggle,
  UpdateSchoolAdminMeInput,
  UpdateStudentInput,
  UpdateTeacherInput,
  UserStatus,
} from './types';

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// Teachers
export const listTeachers = (): Promise<SchoolTeacher[]> => apiRequestList('/school/teachers');

export const inviteTeacher = (input: InviteTeacherInput): Promise<InviteTeacherResult> =>
  apiRequest('/school/teachers/invite', { method: 'POST', body: input });

export const bulkInviteTeachers = (file: File): Promise<BulkImportResult> =>
  apiUpload('/school/teachers/bulk-invite', file);

export const updateTeacherStatus = (teacherId: string, status: UserStatus): Promise<SchoolTeacher> =>
  apiRequest(`/school/teachers/${teacherId}/status`, { method: 'PATCH', body: { status } });

export const updateTeacher = (teacherId: string, input: UpdateTeacherInput): Promise<SchoolTeacher> =>
  apiRequest(`/school/teachers/${teacherId}`, { method: 'PATCH', body: input });

export const resetTeacherPassword = (teacherId: string): Promise<ResetPasswordResult> =>
  apiRequest(`/school/teachers/${teacherId}/reset-password`, { method: 'POST' });

export const exportTeachers = (): Promise<void> => apiDownload('/school/teachers/export', 'teachers.csv');

/** Permanently deletes a teacher - unlike status (deactivate/activate), this
 * can't be undone. Idempotent server-side, so a batch of deletes can be
 * fired in parallel for "multi-delete" without per-row error handling. */
export const deleteTeacher = (teacherId: string): Promise<void> =>
  apiRequest(`/school/teachers/${teacherId}`, { method: 'DELETE' });

export const sendTeacherCredentialsEmail = (
  teacherId: string,
  input: SendCredentialsEmailInput,
): Promise<SendCredentialsEmailResult> =>
  apiRequest(`/school/teachers/${teacherId}/send-credentials-email`, { method: 'POST', body: input });

// Students
export const listStudents = (classId?: string): Promise<SchoolStudent[]> =>
  apiRequestList(classId ? `/school/students?classId=${encodeURIComponent(classId)}` : '/school/students');

export const createStudent = (input: CreateStudentInput): Promise<CreateStudentResult> =>
  apiRequest('/school/students', { method: 'POST', body: input });

export const bulkCreateStudents = (file: File): Promise<BulkImportResult> =>
  apiUpload('/school/students/bulk-create', file);

export const updateStudent = (studentId: string, input: UpdateStudentInput): Promise<SchoolStudent> =>
  apiRequest(`/school/students/${studentId}`, { method: 'PATCH', body: input });

export const resetStudentPassword = (studentId: string): Promise<ResetPasswordResult> =>
  apiRequest(`/school/students/${studentId}/reset-password`, { method: 'POST' });

export const exportStudents = (): Promise<void> => apiDownload('/school/students/export', 'students.csv');

export const deleteStudent = (studentId: string): Promise<void> =>
  apiRequest(`/school/students/${studentId}`, { method: 'DELETE' });

export const sendStudentCredentialsEmail = (
  studentId: string,
  input: SendCredentialsEmailInput,
): Promise<SendCredentialsEmailResult> =>
  apiRequest(`/school/students/${studentId}/send-credentials-email`, { method: 'POST', body: input });

// Classes
export const listClasses = (): Promise<SchoolAdminClass[]> => apiRequestList('/school/classes');

export const createClass = (input: CreateClassInput): Promise<SchoolAdminClass> =>
  apiRequest('/school/classes', { method: 'POST', body: input });

export const updateClass = (classId: string, input: CreateClassInput): Promise<SchoolAdminClass> =>
  apiRequest(`/school/classes/${classId}`, { method: 'PATCH', body: input });

export const updateClassAssignments = (
  classId: string,
  assignments: ClassAssignment[],
): Promise<SchoolAdminClass> =>
  apiRequest(`/school/classes/${classId}/assignments`, { method: 'PUT', body: { assignments } });

export const updateClassStatus = (classId: string, status: UserStatus): Promise<SchoolAdminClass> =>
  apiRequest(`/school/classes/${classId}/status`, { method: 'PATCH', body: { status } });

export const deleteClass = (classId: string): Promise<void> =>
  apiRequest(`/school/classes/${classId}`, { method: 'DELETE' });

// Curriculum
export const getCurriculum = (): Promise<SchoolCurriculum> => apiRequest('/school/curriculum');

export const updateCurriculum = (subjectIds: string[]): Promise<SchoolCurriculum> =>
  apiRequest('/school/curriculum', { method: 'PUT', body: { subjectIds } });

export const createSubject = (input: CreateSubjectInput): Promise<SubjectToggle> =>
  apiRequest('/school/curriculum/subjects', { method: 'POST', body: input });

// Datasets - enable/disable only; creation and editing are Super-Admin-only
// (global catalog), see spec/docs for why.
export const listDatasets = (): Promise<SchoolDataset[]> => apiRequestList('/school/datasets');

export const updateDatasets = (datasetIds: string[]): Promise<SchoolDataset[]> =>
  apiRequestList('/school/datasets', { method: 'PUT', body: { datasetIds } });

// Analytics + subscription (read-only)
export const getAnalytics = (): Promise<SchoolAnalytics> => apiRequest('/school/analytics');

export const getSubscription = (): Promise<SchoolSubscription> => apiRequest('/school/subscription');

// Account
export const acknowledgePasswordChange = (): Promise<{ mustChangePassword: boolean }> =>
  apiRequest('/me/acknowledge-password-change', { method: 'POST' });

// Question-generation defaults
export const getDefaultBloomDistribution = (): Promise<BloomDistributionResult> =>
  apiRequest('/school/curriculum/default-bloom-distribution');

export const updateDefaultBloomDistribution = (
  distribution: BloomDistribution,
): Promise<BloomDistributionResult> =>
  apiRequest('/school/curriculum/default-bloom-distribution', { method: 'PUT', body: { distribution } });

// School-wide oversight (read-only) - School Admin observes Teacher-created
// content across the whole school; none of these support create/edit.
export const listSchoolVoiceTests = (params: {
  classId?: string;
  teacherId?: string;
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolVoiceTest>> =>
  apiRequest(`/school/voice-tests${toQuery(params)}`);

export const listSchoolHomework = (params: {
  classId?: string;
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolHomework>> => apiRequest(`/school/homework${toQuery(params)}`);

export const listSchoolQuestionPapers = (params: {
  subjectId?: string;
  createdBy?: string;
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolQuestionPaper>> =>
  apiRequest(`/school/question-papers${toQuery(params)}`);

export const listSchoolRetestProgress = (params: {
  classId?: string;
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolRetestProgress>> =>
  apiRequest(`/school/retest-progress${toQuery(params)}`);

export const listSchoolImprovement = (params: {
  classId?: string;
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolImprovement>> => apiRequest(`/school/improvement${toQuery(params)}`);

export const getSchoolLeaderboard = (params: {
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolLeaderboardEntry>> => apiRequest(`/school/leaderboard${toQuery(params)}`);

export const listSchoolAuditLog = (params: {
  limit: number;
  offset: number;
}): Promise<PageEnvelope<SchoolAuditLogEntry>> => apiRequest(`/school/audit-log${toQuery(params)}`);

// Self-service account (the signed-in School Admin's own profile)
export const getSchoolAdminMe = (): Promise<SchoolAdminMe> => apiRequest('/school/me');

export const updateSchoolAdminMe = (input: UpdateSchoolAdminMeInput): Promise<SchoolAdminMe> =>
  apiRequest('/school/me', { method: 'PATCH', body: input });
