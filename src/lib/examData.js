export const EXAM_STORAGE_KEY = "exam-buzz-exams";

export const ALL_EXAM_CATEGORY_VALUE = "__all_exam_categories__";
export const ALL_EXAM_SUBJECT_VALUE = "__all_exam_subjects__";

export const EXAM_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const ACCEPTED_EXAM_PDF_TYPES = ["application/pdf"];
export const EXAM_PDF_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const DEFAULT_EXAMS = [
  {
    id: "exam-001",
    name: "BCS Preliminary Model Test 01",
    categoryId: "category-006",
    categoryID: "category-006",
    subjectIds: ["subject-002", "subject-003"],
    topicIds: ["topic-001", "topic-003"],
    durationIntMinutes: 60,
    passMark: 40,
    publishedDate: "24-06-2026",
    publishedTime: "10:30",
    expiredDate: "30-06-2026",
    expiredTime: "23:59",
    questionPDF: "",
    questionPDFName: "",
    demoAnswerPDF: "",
    demoAnswerPDFName: "",
    packageId: "pkg-bcs-written-47",
    status: true,
    createdAt: "2026-06-25T06:33:19.000Z",
    updatedAt: "2026-06-25T06:33:19.000Z",
    category: {
      id: "category-006",
      parentID: "category-005",
      name: "BCS",
      icon: null,
      status: true,
    },
  },
];

export function createExamId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `exam-${crypto.randomUUID()}`;
  }

  return `exam-${Date.now().toString(36)}`;
}

export function getExamCategoryId(exam) {
  return exam?.categoryId ?? exam?.categoryID ?? "";
}

export function isValidExamDate(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(value || ""));
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidExamTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

export function formatExamTimeline(exam) {
  return {
    publish: `${exam.publishedDate || "No date"} ${exam.publishedTime || ""}`.trim(),
    expire: `${exam.expiredDate || "No date"} ${exam.expiredTime || ""}`.trim(),
  };
}

export function getExamPdfLabel(fileName, fallbackLabel) {
  return fileName || fallbackLabel;
}
