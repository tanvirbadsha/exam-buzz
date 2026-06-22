export const NOTICE_BOARD_STORAGE_KEY = "exam-buzz-notice-board";

export const NOTICE_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const DEFAULT_NOTICE_BOARD = [
  {
    id: "notice-001",
    title: "BCS written model test schedule updated",
    description:
      "<p>The next BCS written model test schedule is now available in the mobile app. Students should review the updated exam time before joining.</p>",
    status: "active",
    createdAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "notice-002",
    title: "New package access rules",
    description:
      "<p>Students with active premium packages can now access the new current affairs practice set from the app dashboard.</p>",
    status: "active",
    createdAt: "2026-06-16T12:30:00.000Z",
  },
  {
    id: "notice-003",
    title: "Maintenance window",
    description:
      "<p>The app may be unavailable for a short maintenance window after midnight. Please complete pending exams before that time.</p>",
    status: "inactive",
    createdAt: "2026-06-12T15:45:00.000Z",
  },
];

export function createNoticeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `notice-${crypto.randomUUID()}`;
  }

  return `notice-${Date.now().toString(36)}`;
}
