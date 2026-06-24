export const EXAM_TYPE_STORAGE_KEY = "exam-buzz-exam-types";

export const DEFAULT_EXAM_TYPES_RESPONSE = {
  examTypes: [
    {
      id: 4,
      name: "BCS",
      icon: null,
      createdAt: "2026-06-24T11:03:05.000Z",
      updatedAt: "2026-06-24T11:03:05.000Z",
    },
    {
      id: 2,
      name: "Written",
      icon: null,
      createdAt: "2026-06-23T08:20:54.000Z",
      updatedAt: "2026-06-23T08:20:54.000Z",
    },
    {
      id: 1,
      name: "Preliminary",
      icon: null,
      createdAt: "2026-06-23T08:20:54.000Z",
      updatedAt: "2026-06-23T08:20:54.000Z",
    },
  ],
};

export const DEFAULT_EXAM_TYPE_DETAIL_RESPONSE = {
  status: 200,
  message: "Exam type retrieved successfully",
  examType: {
    id: 2,
    name: "Written",
    icon: null,
    createdAt: "2026-06-23T08:20:54.000Z",
    updatedAt: "2026-06-23T08:20:54.000Z",
  },
};

export function createExamTypeId(examTypes) {
  const highestId = examTypes.reduce(
    (maxId, examType) => Math.max(maxId, Number(examType.id) || 0),
    0,
  );

  return highestId + 1;
}

export function formatExamTypeDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function isExamTypeIconImage(icon) {
  if (typeof icon !== "string") return false;

  return (
    icon.startsWith("data:image/") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/")
  );
}
