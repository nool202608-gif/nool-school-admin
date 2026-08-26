// Mirrors nool-core's services/core/src/api/schemas/school_admin.py exactly
// (field-for-field, camelCase) - see spec/docs/api-reference.html "School Admin".

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export const BLOOM_LEVELS: readonly BloomLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

export interface SchoolTeacher {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  employeeId: string | null;
  classIds: string[];
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface InviteTeacherInput {
  email: string;
  displayName: string;
  phoneNumber?: string;
  employeeId?: string;
}

/** No account details echoed back beyond what's needed to reveal the temp password once. */
export interface InviteTeacherResult {
  id: string;
  status: UserStatus;
  tempPassword: string;
}

export interface SchoolStudent {
  id: string;
  displayName: string;
  email: string;
  classId: string;
  rollNumber: number;
  guardianName: string | null;
  guardianPhone: string | null;
  dateOfBirth: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface CreateStudentInput {
  displayName: string;
  email: string;
  classId: string;
  rollNumber: number;
  guardianName?: string;
  guardianPhone?: string;
  dateOfBirth?: string;
}

export interface CreateStudentResult {
  id: string;
  displayName: string;
  email: string;
  classId: string;
  rollNumber: number;
  status: UserStatus;
  tempPassword: string;
}

export interface UpdateStudentInput {
  classId?: string;
  status?: UserStatus;
  displayName?: string;
  guardianName?: string;
  guardianPhone?: string;
  dateOfBirth?: string;
}

export interface UpdateTeacherInput {
  displayName?: string;
  phoneNumber?: string;
  employeeId?: string;
}

/** No account details echoed back beyond what's needed to reveal the new temp password once. */
export interface ResetPasswordResult {
  tempPassword: string;
}

export type BloomDistribution = Partial<Record<BloomLevel, number>>;

export interface BloomDistributionResult {
  /** null = no override set - generation falls back to the teacher's own choice / system default. */
  distribution: BloomDistribution | null;
}

/** One row's outcome from a bulk-invite/bulk-create upload. */
export interface BulkRowResult {
  row: number;
  status: string;
  email: string | null;
  tempPassword: string | null;
  error: string | null;
}

export interface BulkImportResult {
  results: BulkRowResult[];
  createdCount: number;
  errorCount: number;
}

export interface ClassAssignment {
  teacherId: string;
  subjectId: string;
}

export interface SchoolAdminClass {
  id: string;
  grade: number;
  section: string;
  studentCount: number;
  assignments: ClassAssignment[];
  status: UserStatus;
}

export interface CreateClassInput {
  grade: number;
  section: string;
}

/** School Admin can only ever create classes for grades 1 through 12. */
export const MIN_GRADE = 1;
export const MAX_GRADE = 12;

export interface SubjectToggle {
  id: string;
  name: string;
  enabled: boolean;
}

export interface CreateSubjectInput {
  name: string;
}

/** The generated credential email is drafted client-side (subject/body
 * prefilled from the invite/reset context) and the admin can edit it
 * before sending - see CredentialReveal's "Send by email" action. */
export interface SendCredentialsEmailInput {
  subject: string;
  message: string;
  tempPassword: string;
}

export interface SendCredentialsEmailResult {
  sent: boolean;
}

export interface SchoolCurriculum {
  board: string;
  subjects: SubjectToggle[];
}

/** A dataset as scoped to this school - `enabled` is this school's own
 * toggle (school_datasets), separate from the global catalog Super Admin
 * manages. Creation/editing stays Super-Admin-only; this app only toggles
 * availability. */
export interface SchoolDataset {
  id: string;
  name: string;
  questionCount: number;
  description: string;
  enabled: boolean;
}

export interface BloomScore {
  level: BloomLevel;
  percent: number | null;
}

export interface ClassBreakdown {
  classId: string;
  label: string;
  masteryAvgPercent: number;
  improvementPercent: number;
}

export interface SchoolAnalytics {
  schoolMasteryAvgPercent: number;
  classBreakdown: ClassBreakdown[];
  bloomAverages: BloomScore[];
}

/** Envelope every paginated oversight endpoint returns - see apiClient.ts's
 * apiRequest, used directly here (not apiRequestList) so the real `total`
 * is available for a Prev/Next control.
 */
export interface PageEnvelope<T> {
  items: T[];
  total: number;
}

export type TestStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'RESULTS_PROCESSING' | 'RESULTS_READY';
export type HomeworkStatus = 'GENERATING' | 'REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type QuestionPaperStatus = 'DRAFT' | 'GENERATING' | 'VALIDATION_FAILED' | 'REVIEW' | 'FINALIZED';

export interface SchoolVoiceTest {
  id: string;
  classLabel: string;
  subjectName: string;
  teacherName: string | null;
  status: TestStatus;
  assignedCount: number;
  completedCount: number;
  createdAt: string;
}

export interface SchoolHomework {
  id: string;
  classLabel: string;
  gapTopic: string;
  teacherName: string | null;
  status: HomeworkStatus;
  assignedCount: number;
  completedCount: number;
}

export interface SchoolQuestionPaper {
  id: string;
  name: string;
  examType: string;
  subjectName: string;
  createdByName: string;
  status: QuestionPaperStatus;
  createdAt: string;
}

export interface SchoolRetestProgress {
  homeworkId: string;
  classLabel: string;
  gapTopic: string;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

export interface SchoolImprovement {
  testId: string;
  homeworkId: string;
  classLabel: string;
  gapTopic: string;
  baselinePercent: number;
  retestPercent: number;
  improvementPercent: number;
  assignedCount: number;
  retestedCount: number;
}

export interface SchoolLeaderboardEntry {
  studentId: string;
  displayName: string;
  classLabel: string;
  points: number;
  rank: number;
}

export interface SchoolSubscription {
  schoolId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  renewsAt: string;
  teacherCount: number;
  teacherLimit: number;
  studentCount: number;
  studentLimit: number;
  testCount: number;
  testLimit: number | null;
  questionPaperCount: number;
  questionPaperLimit: number | null;
}

export interface SchoolAuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface SchoolAdminMe {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  schoolName: string;
}

export interface UpdateSchoolAdminMeInput {
  displayName?: string;
  phoneNumber?: string;
}
