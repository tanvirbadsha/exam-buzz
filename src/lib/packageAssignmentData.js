export const PACKAGE_ASSIGNMENT_STORAGE_KEY = "exam-buzz-package-assignments";

export const PAYMENT_METHOD_OPTIONS = [
  { label: "Cash", value: "cash" },
  { label: "bKash", value: "bkash" },
  { label: "Nagad", value: "nagad" },
  { label: "Bank", value: "bank" },
];

export function createPackageAssignmentId() {
  return `assign-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function formatAssignmentAmount(amount) {
  return `${Number(amount || 0).toLocaleString("en-BD")} BDT`;
}

export function getPaymentMethodLabel(paymentMethod) {
  return (
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === paymentMethod)
      ?.label || "Not set"
  );
}
