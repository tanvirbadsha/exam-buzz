export const PACKAGE_HISTORY_STORAGE_KEY = "exam-buzz-package-history-v1";

export const PAYMENT_METHOD_OPTIONS = [
  { label: "All methods", value: "all" },
  { label: "bKash", value: "bKash" },
  { label: "Nagad", value: "Nagad" },
  { label: "Rocket", value: "Rocket" },
  { label: "Card", value: "Card" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

export const DEFAULT_PACKAGE_HISTORY = [
  {
    id: "history-sabbir-1",
    studentId: "student-sabbir",
    packageName: "BCS Complete",
    amount: 8500,
    paymentMethod: "bKash",
    paymentMethodIdentity: "TRX-BCS-1001",
    paymentDate: "2026-06-01",
  },
  {
    id: "history-sabbir-2",
    studentId: "student-sabbir",
    packageName: "Bank Job Pro",
    amount: 5200,
    paymentMethod: "Nagad",
    paymentMethodIdentity: "NGD-781245",
    paymentDate: "2026-06-10",
  },
  {
    id: "history-farhana-1",
    studentId: "student-farhana",
    packageName: "Bank Job Pro",
    amount: 12400,
    paymentMethod: "Card",
    paymentMethodIdentity: "CARD-9021",
    paymentDate: "2026-06-07",
  },
  {
    id: "history-tasnim-1",
    studentId: "student-tasnim",
    packageName: "NTRCA Master",
    amount: 9000,
    paymentMethod: "bKash",
    paymentMethodIdentity: "BKS-448210",
    paymentDate: "2026-05-28",
  },
  {
    id: "history-tasnim-2",
    studentId: "student-tasnim",
    packageName: "BCS Complete",
    amount: 6500,
    paymentMethod: "Nagad",
    paymentMethodIdentity: "NGD-739011",
    paymentDate: "2026-06-04",
  },
  {
    id: "history-tasnim-3",
    studentId: "student-tasnim",
    packageName: "HSC Science",
    amount: 3500,
    paymentMethod: "Rocket",
    paymentMethodIdentity: "RKT-612900",
    paymentDate: "2026-06-13",
  },
  {
    id: "history-tasnim-4",
    studentId: "student-tasnim",
    packageName: "Primary Teacher",
    amount: 3000,
    paymentMethod: "Bank Transfer",
    paymentMethodIdentity: "BANK-230118",
    paymentDate: "2026-06-18",
  },
  {
    id: "history-rakib-1",
    studentId: "student-rakib",
    packageName: "HSC Science",
    amount: 9800,
    paymentMethod: "Card",
    paymentMethodIdentity: "CARD-6512",
    paymentDate: "2026-06-09",
  },
];

export function formatPaymentDate(date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}
