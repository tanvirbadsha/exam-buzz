export const CATEGORY_STORAGE_KEY = "exam-buzz-categories";

export const CATEGORY_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const DEFAULT_EXAM_CATEGORIES = [
  {
    id: "category-001",
    name: "Academic Exams",
    slug: "academic-exams",
    description: "School and college level exam preparation.",
    parentId: null,
    status: "active",
    examCount: 12,
    createdAt: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "category-002",
    name: "SSC",
    slug: "ssc",
    description: "Secondary school certificate exams.",
    parentId: "category-001",
    status: "active",
    examCount: 5,
    createdAt: "2026-06-10T09:10:00.000Z",
  },
  {
    id: "category-003",
    name: "Science Group",
    slug: "science-group",
    description: "Science group model tests and subject exams.",
    parentId: "category-002",
    status: "active",
    examCount: 3,
    createdAt: "2026-06-10T09:20:00.000Z",
  },
  {
    id: "category-004",
    name: "HSC",
    slug: "hsc",
    description: "Higher secondary certificate exams.",
    parentId: "category-001",
    status: "active",
    examCount: 4,
    createdAt: "2026-06-10T09:25:00.000Z",
  },
  {
    id: "category-005",
    name: "Job Preparation",
    slug: "job-preparation",
    description: "Government and private job preparation exams.",
    parentId: null,
    status: "active",
    examCount: 18,
    createdAt: "2026-06-11T11:00:00.000Z",
  },
  {
    id: "category-006",
    name: "BCS",
    slug: "bcs",
    description: "BCS preliminary, written and viva exams.",
    parentId: "category-005",
    status: "active",
    examCount: 9,
    createdAt: "2026-06-11T11:15:00.000Z",
  },
  {
    id: "category-007",
    name: "Bank Jobs",
    slug: "bank-jobs",
    description: "Bank recruitment exam preparation.",
    parentId: "category-005",
    status: "inactive",
    examCount: 2,
    createdAt: "2026-06-11T11:30:00.000Z",
  },
];

export function createCategoryId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `category-${crypto.randomUUID()}`;
  }

  return `category-${Date.now().toString(36)}`;
}

export function createCategorySlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
