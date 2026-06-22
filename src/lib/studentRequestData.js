export const STUDENT_REQUEST_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export const STUDENT_REQUEST_STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  ...STUDENT_REQUEST_STATUSES,
];

export const studentRequestData = [
  {
    id: "request-001",
    studentName: "Afsana Rahman",
    studentId: "STD-1024",
    request:
      "Needs the HSC Physics package extended for seven days because of illness.",
    status: "pending",
  },
  {
    id: "request-002",
    studentName: "Mahmud Hasan",
    studentId: "STD-1188",
    request: "Requested correction of the registered phone number.",
    status: "resolved",
  },
  {
    id: "request-003",
    studentName: "Nusrat Jahan",
    studentId: "STD-1302",
    request:
      "Asked for access to retake the BCS preliminary model test from last week.",
    status: "pending",
  },
  {
    id: "request-004",
    studentName: "Rakibul Islam",
    studentId: "STD-1417",
    request: "Requested refund for a mistakenly purchased package.",
    status: "rejected",
  },
  {
    id: "request-005",
    studentName: "Sadia Akter",
    studentId: "STD-1561",
    request:
      "Wants the written exam answer sheet reviewed again after score mismatch.",
    status: "pending",
  },
  {
    id: "request-006",
    studentName: "Tanvir Ahmed",
    studentId: "STD-1639",
    request: "Requested package migration from SSC Batch to HSC Science.",
    status: "resolved",
  },
];

export const studentRequestStatusMeta = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};
