export const FOLDER_STORAGE_KEY = "exam-buzz-folders";

export const DEFAULT_FOLDERS = [
  {
    id: "folder-001",
    name: "General Knowledge",
    parentId: null,
    isActive: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-02-20T14:30:00.000Z",
  },
  {
    id: "folder-002",
    name: "Science",
    parentId: null,
    isActive: true,
    createdAt: "2026-01-16T10:00:00.000Z",
    updatedAt: "2026-02-21T14:30:00.000Z",
  },
  {
    id: "folder-003",
    name: "Mathematics",
    parentId: null,
    isActive: true,
    createdAt: "2026-01-17T10:00:00.000Z",
    updatedAt: "2026-02-22T14:30:00.000Z",
  },
  {
    id: "folder-004",
    name: "English Literature",
    parentId: null,
    isActive: false,
    createdAt: "2026-01-18T10:00:00.000Z",
    updatedAt: "2026-02-23T14:30:00.000Z",
  },
  {
    id: "folder-005",
    name: "Physics",
    parentId: "folder-002",
    isActive: true,
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-03-01T14:30:00.000Z",
  },
  {
    id: "folder-006",
    name: "Chemistry",
    parentId: "folder-002",
    isActive: true,
    createdAt: "2026-02-02T10:00:00.000Z",
    updatedAt: "2026-03-02T13:45:00.000Z",
  },
  {
    id: "folder-007",
    name: "Algebra",
    parentId: "folder-003",
    isActive: true,
    createdAt: "2026-02-03T10:00:00.000Z",
    updatedAt: "2026-03-03T12:15:00.000Z",
  },
  {
    id: "folder-008",
    name: "Geometry",
    parentId: "folder-003",
    isActive: false,
    createdAt: "2026-02-04T10:00:00.000Z",
    updatedAt: "2026-03-04T11:20:00.000Z",
  },
  {
    id: "folder-009",
    name: "Prep Questions",
    parentId: "folder-001",
    isActive: true,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-03-05T16:00:00.000Z",
  },
  {
    id: "folder-010",
    name: "Exam Papers",
    parentId: "folder-001",
    isActive: true,
    createdAt: "2026-02-11T10:00:00.000Z",
    updatedAt: "2026-03-06T09:30:00.000Z",
  },
];

export function createFolderId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `folder-${crypto.randomUUID()}`;
  }
  return `folder-${Date.now().toString(36)}`;
}

export function formatDate(isoString) {
  if (!isoString) return "Not available";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(isoString) {
  if (!isoString) return "Not available";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getDescendantFolderIds(folders, folderId) {
  const descendantIds = new Set();
  const queue = [folderId];

  while (queue.length > 0) {
    const parentId = queue.shift();
    const children = folders.filter((f) => f.parentId === parentId);
    for (const child of children) {
      if (!descendantIds.has(child.id)) {
        descendantIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return descendantIds;
}

export function getParentName(folders, parentId) {
  if (!parentId) return "None";
  const parent = folders.find((f) => f.id === parentId);
  return parent?.name || "Unknown";
}

export function buildParentFolderOptions(folders, excludeFolderId = null) {
  const excludeIds = new Set();
  if (excludeFolderId) {
    excludeIds.add(excludeFolderId);
    const desc = getDescendantFolderIds(folders, excludeFolderId);
    desc.forEach((id) => excludeIds.add(id));
  }

  return folders
    .filter((f) => !excludeIds.has(f.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({
      label: f.name,
      value: f.id,
    }));
}
