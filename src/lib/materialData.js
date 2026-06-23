export const MATERIAL_STORAGE_KEY = "exam-buzz-materials";

export const ALL_MATERIAL_CATEGORY_VALUE = "__all_material_categories__";
export const ALL_MATERIAL_EXAM_VALUE = "__all_material_exams__";

export const MATERIAL_EXAM_OPTIONS = [
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

export const MATERIAL_EXAM_FILTER_OPTIONS = [
  { label: "All exams", value: ALL_MATERIAL_EXAM_VALUE },
  ...MATERIAL_EXAM_OPTIONS,
];

export const ACCEPTED_MATERIAL_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const MATERIAL_MAX_FILE_SIZE = 2 * 1024 * 1024;

export const DEFAULT_MATERIALS = [
  {
    id: "material-001",
    title: "BCS Bangla prose lecture sheet",
    categoryId: "category-006",
    examId: "bcs-47-written",
    materialFolderId: "topic-001",
    fileName: "bcs-bangla-prose-sheet.pdf",
    fileType: "application/pdf",
    fileSize: 184320,
    fileDataUrl: "",
    createdAt: "2026-06-19T09:30:00.000Z",
  },
  {
    id: "material-002",
    title: "SSC physics formula image",
    categoryId: "category-003",
    examId: "ssc-science-final-prep",
    materialFolderId: "topic-002",
    fileName: "physics-formula-chart.png",
    fileType: "image/png",
    fileSize: 143360,
    fileDataUrl: "",
    createdAt: "2026-06-20T11:00:00.000Z",
  },
  {
    id: "material-003",
    title: "Bank arithmetic practice set",
    categoryId: "category-007",
    examId: "bank-preliminary-batch",
    materialFolderId: "topic-003",
    fileName: "bank-arithmetic-practice.pdf",
    fileType: "application/pdf",
    fileSize: 258048,
    fileDataUrl: "",
    createdAt: "2026-06-21T15:20:00.000Z",
  },
];

export function createMaterialId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `material-${crypto.randomUUID()}`;
  }

  return `material-${Date.now().toString(36)}`;
}

export function getMaterialExamLabel(examId) {
  return (
    MATERIAL_EXAM_OPTIONS.find((examOption) => examOption.value === examId)
      ?.label || "Unknown exam"
  );
}

export function getMaterialFileKind(fileType) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType?.startsWith("image/")) return "Image";
  return "File";
}

export function formatMaterialFileSize(fileSize) {
  const size = Number(fileSize) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMaterialCreatedAt(createdAt) {
  if (!createdAt) return "Not available";

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdDate);
}
