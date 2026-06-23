export const SUBJECT_STORAGE_KEY = "exam-buzz-subjects";
export const SUBJECT_TOPIC_STORAGE_KEY = "exam-buzz-subject-topics";

export const SUBJECT_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const DEFAULT_EXAM_SUBJECTS = [
  {
    id: "subject-001",
    name: "Bangla",
    icon: "BN",
    parentId: null,
    status: "active",
    createdAt: "2026-06-12T09:00:00.000Z",
  },
  {
    id: "subject-002",
    name: "Bangla 1st Paper",
    icon: "B1",
    parentId: "subject-001",
    status: "active",
    createdAt: "2026-06-12T09:10:00.000Z",
  },
  {
    id: "subject-003",
    name: "Bangla 2nd Paper",
    icon: "B2",
    parentId: "subject-001",
    status: "active",
    createdAt: "2026-06-12T09:15:00.000Z",
  },
  {
    id: "subject-004",
    name: "English",
    icon: "EN",
    parentId: null,
    status: "active",
    createdAt: "2026-06-12T09:20:00.000Z",
  },
  {
    id: "subject-005",
    name: "Mathematics",
    icon: "MT",
    parentId: null,
    status: "inactive",
    createdAt: "2026-06-12T09:25:00.000Z",
  },
];

export const DEFAULT_SUBJECT_TOPICS = [
  {
    id: "topic-001",
    subjectId: "subject-002",
    name: "Prose",
    status: "active",
    createdAt: "2026-06-12T10:00:00.000Z",
  },
  {
    id: "topic-002",
    subjectId: "subject-002",
    name: "Poetry",
    status: "active",
    createdAt: "2026-06-12T10:05:00.000Z",
  },
  {
    id: "topic-003",
    subjectId: "subject-003",
    name: "Grammar",
    status: "active",
    createdAt: "2026-06-12T10:10:00.000Z",
  },
  {
    id: "topic-004",
    subjectId: "subject-004",
    name: "Vocabulary",
    status: "inactive",
    createdAt: "2026-06-12T10:15:00.000Z",
  },
];

export function createSubjectId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `subject-${crypto.randomUUID()}`;
  }

  return `subject-${Date.now().toString(36)}`;
}

export function createTopicId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `topic-${crypto.randomUUID()}`;
  }

  return `topic-${Date.now().toString(36)}`;
}
