export const RECORD_CLASS_STORAGE_KEY = "exam-buzz-record-classes";

export const ALL_RECORD_CLASS_CATEGORY_VALUE = "__all_record_class_categories__";
export const NO_EXAM_VALUE = "__no_exam__";

export const RECORD_CLASS_EXAM_OPTIONS = [
  {
    label: "BCS 47th Written",
    value: "bcs-47-written",
    categoryId: "category-006",
  },
  {
    label: "BCS Preliminary Model Test",
    value: "bcs-preliminary-model-test",
    categoryId: "category-006",
  },
  {
    label: "Bank Preliminary Batch",
    value: "bank-preliminary-batch",
    categoryId: "category-007",
  },
  {
    label: "SSC Science Final Prep",
    value: "ssc-science-final-prep",
    categoryId: "category-003",
  },
  {
    label: "HSC Board Model Exam",
    value: "hsc-board-model-exam",
    categoryId: "category-004",
  },
];

export const RECORD_CLASS_EXAM_FILTER_OPTIONS = [
  { label: "All exams", value: "all" },
  { label: "No exam", value: NO_EXAM_VALUE },
  ...RECORD_CLASS_EXAM_OPTIONS,
];

export const DEFAULT_RECORD_CLASSES = [
  {
    id: "record-class-001",
    title: "BCS written Bangla answer planning",
    categoryId: "category-006",
    subjectId: "subject-002",
    materialFolderId: "topic-001",
    examId: "bcs-47-written",
    publishAt: "2026-06-20T20:00",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    createdAt: "2026-06-18T10:30:00.000Z",
  },
  {
    id: "record-class-002",
    title: "SSC science physics revision",
    categoryId: "category-003",
    subjectId: "subject-005",
    materialFolderId: "",
    examId: "ssc-science-final-prep",
    publishAt: "2026-06-21T18:30",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    createdAt: "2026-06-19T12:00:00.000Z",
  },
  {
    id: "record-class-003",
    title: "Bank jobs arithmetic shortcuts",
    categoryId: "category-007",
    subjectId: "subject-005",
    materialFolderId: "",
    examId: "",
    publishAt: "2026-06-22T19:00",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    createdAt: "2026-06-20T09:45:00.000Z",
  },
];

export function createRecordClassId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `record-class-${crypto.randomUUID()}`;
  }

  return `record-class-${Date.now().toString(36)}`;
}

export function getRecordClassExamLabel(examId) {
  if (!examId) return "No exam";

  return (
    RECORD_CLASS_EXAM_OPTIONS.find((examOption) => examOption.value === examId)
      ?.label || "Unknown exam"
  );
}

export function formatRecordClassPublishAt(publishAt) {
  if (!publishAt) return "Not scheduled";

  const publishDate = new Date(publishAt);
  if (Number.isNaN(publishDate.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(publishDate);
}

export function getYoutubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (hostname.endsWith("youtube.com")) {
      if (parsedUrl.pathname.startsWith("/watch")) {
        return parsedUrl.searchParams.get("v") || "";
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(pathParts[0])) {
        return pathParts[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function isValidYoutubeUrl(url) {
  return Boolean(getYoutubeVideoId(url));
}
