export const STUDENT_STORAGE_KEY = "exam-buzz-students-v1";

export const STUDENT_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const STUDENT_ACCOUNT_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const STUDENT_GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export const STUDENT_PACKAGE_OPTIONS = [
  { label: "All packages", value: "all" },
  { label: "BCS Complete", value: "BCS Complete" },
  { label: "Bank Job Pro", value: "Bank Job Pro" },
  { label: "Primary Teacher", value: "Primary Teacher" },
  { label: "NTRCA Master", value: "NTRCA Master" },
  { label: "HSC Science", value: "HSC Science" },
];

export const DEFAULT_STUDENTS = [
  {
    id: "student-sabbir",
    name: "Sabbir Ahmed",
    userId: "USR-1001",
    gender: "male",
    phone: "+880 1710-123456",
    password: "123456",
    registrationId: "REG-2026-001",
    purchasedPackage: "BCS Complete",
    purchasedPackageCount: 3,
    purchaseAmount: 18500,
    preliminaryExam: 18,
    writtenExam: 6,
    isActive: true,
    email: "sabbir@example.com",
    address: "Mirpur, Dhaka",
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "student-farhana",
    name: "Farhana Akter",
    userId: "USR-1002",
    gender: "female",
    phone: "+880 1811-234567",
    password: "123456",
    registrationId: "REG-2026-002",
    purchasedPackage: "Bank Job Pro",
    purchasedPackageCount: 2,
    purchaseAmount: 12400,
    preliminaryExam: 12,
    writtenExam: 4,
    isActive: true,
    email: "farhana@example.com",
    address: "Uttara, Dhaka",
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "student-nayeem",
    name: "Nayeem Hasan",
    userId: "USR-1003",
    gender: "male",
    phone: "+880 1912-345678",
    password: "123456",
    registrationId: "REG-2026-003",
    purchasedPackage: "Primary Teacher",
    purchasedPackageCount: 1,
    purchaseAmount: 6500,
    preliminaryExam: 9,
    writtenExam: 2,
    isActive: false,
    email: "nayeem@example.com",
    address: "Rajshahi, Bangladesh",
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "student-tasnim",
    name: "Tasnim Jahan",
    userId: "USR-1004",
    gender: "female",
    phone: "+880 1613-456789",
    password: "123456",
    registrationId: "REG-2026-004",
    purchasedPackage: "NTRCA Master",
    purchasedPackageCount: 4,
    purchaseAmount: 22000,
    preliminaryExam: 24,
    writtenExam: 10,
    isActive: true,
    email: "tasnim@example.com",
    address: "Sylhet, Bangladesh",
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "student-rakib",
    name: "Rakibul Islam",
    userId: "USR-1005",
    gender: "male",
    phone: "+880 1514-567890",
    password: "123456",
    registrationId: "REG-2026-005",
    purchasedPackage: "HSC Science",
    purchasedPackageCount: 2,
    purchaseAmount: 9800,
    preliminaryExam: 15,
    writtenExam: 5,
    isActive: false,
    email: "rakib@example.com",
    address: "Chattogram, Bangladesh",
    createdAt: "2026-06-21T00:00:00.000Z",
  },
];

export function createStudentId() {
  return `student-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function createUserId() {
  return `USR-${Date.now().toString().slice(-6)}`;
}

export function createRegistrationId() {
  return `REG-2026-${Date.now().toString().slice(-5)}`;
}

export function formatStudentCurrency(value) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "BDT",
  }).format(value);
}
