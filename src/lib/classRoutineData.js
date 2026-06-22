export const CLASS_ROUTINE_STORAGE_KEY = "exam-buzz-class-routines";

export const ROUTINE_TYPES = [
  {
    label: "Preliminary Exam Routine",
    value: "preliminary",
    description: "Routine PDF for preliminary exam students.",
  },
  {
    label: "Written Exam Routine",
    value: "written",
    description: "Routine PDF for written exam students.",
  },
];

export const ROUTINE_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const DEFAULT_CLASS_ROUTINES = [
  {
    id: "routine-written",
    examType: "written",
    title: "Written exam batch routine",
    status: "active",
    fileName: "written-exam-routine.pdf",
    fileUrl: "",
    fileSize: 428000,
    updatedAt: "2026-06-17T09:30:00.000Z",
  },
];

export function createRoutineId(examType) {
  return `routine-${examType}`;
}

export function getRoutineTypeMeta(examType) {
  return (
    ROUTINE_TYPES.find((routineType) => routineType.value === examType) ||
    ROUTINE_TYPES[0]
  );
}

export function formatRoutineFileSize(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return "Unknown size";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRoutineUpdatedAt(value) {
  if (!value) return "Not updated";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
