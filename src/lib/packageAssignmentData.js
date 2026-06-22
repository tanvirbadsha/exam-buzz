export const PACKAGE_ASSIGNMENT_STORAGE_KEY = "exam-buzz-package-assignments";

export function createPackageAssignmentId() {
  return `assign-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function formatAssignmentAmount(amount) {
  return `${Number(amount || 0).toLocaleString("en-BD")} BDT`;
}

