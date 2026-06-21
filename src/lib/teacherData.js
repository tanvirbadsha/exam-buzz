export const TEACHER_STORAGE_KEY = "exam-buzz-teachers-v1";

export const TEACHER_PERMISSION_OPTIONS = [
  "BCS",
  "Bank Job Solution",
  "Primary Teacher",
  "NTRCA",
  "SSC",
  "HSC",
  "Railway",
  "Police Constable",
];

export const DEFAULT_TEACHERS = [
  {
    id: "teacher-arif",
    fullName: "Arif Hossain",
    phone: "+880 1712-111222",
    email: "arif.teacher@example.com",
    password: "123456",
    address: "Dhanmondi, Dhaka",
    permissions: ["BCS", "Bank Job Solution", "NTRCA"],
    totalWithdrawal: 52000,
    totalEarning: 148000,
    pendingWithdrawal: 12000,
    totalAssessment: 86,
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "teacher-samia",
    fullName: "Samia Rahman",
    phone: "+880 1813-222333",
    email: "samia.teacher@example.com",
    password: "123456",
    address: "Uttara, Dhaka",
    permissions: ["Primary Teacher", "SSC", "HSC"],
    totalWithdrawal: 38000,
    totalEarning: 99000,
    pendingWithdrawal: 7500,
    totalAssessment: 63,
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "teacher-mahmud",
    fullName: "Mahmud Hasan",
    phone: "+880 1914-333444",
    email: "mahmud.teacher@example.com",
    password: "123456",
    address: "Chattogram, Bangladesh",
    permissions: ["Bank Job Solution", "Railway", "Police Constable"],
    totalWithdrawal: 61000,
    totalEarning: 175500,
    pendingWithdrawal: 5200,
    totalAssessment: 104,
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "teacher-nabila",
    fullName: "Nabila Islam",
    phone: "+880 1615-444555",
    email: "nabila.teacher@example.com",
    password: "123456",
    address: "Sylhet, Bangladesh",
    permissions: ["BCS", "HSC"],
    totalWithdrawal: 24000,
    totalEarning: 72000,
    pendingWithdrawal: 14000,
    totalAssessment: 42,
    createdAt: "2026-06-21T00:00:00.000Z",
  },
];

export function createTeacherId() {
  return `teacher-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "BDT",
  }).format(value);
}
