export const ADMIN_STORAGE_KEY = "exam-buzz-admins-v1";

export const ADMIN_MENU_OPTIONS = [
  {
    group: "Core",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        description: "View the operations dashboard.",
      },
    ],
  },
  {
    group: "Exams",
    items: [
      {
        key: "exams",
        label: "All Exams",
        description: "Create and manage exam records.",
      },
      {
        key: "question-bank",
        label: "Question Bank",
        description: "Manage exam questions and answers.",
      },
      {
        key: "exam-results",
        label: "Results",
        description: "Review published exam results.",
      },
    ],
  },
  {
    group: "Learning",
    items: [
      {
        key: "courses",
        label: "Courses",
        description: "Control course setup and content.",
      },
    ],
  },
  {
    group: "Users",
    items: [
      {
        key: "admins",
        label: "Admin",
        description: "Manage admin accounts.",
      },
      {
        key: "teachers",
        label: "Teacher",
        description: "Manage teacher accounts.",
      },
      {
        key: "students",
        label: "Students",
        description: "Manage student accounts.",
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        key: "roles-access",
        label: "Roles & Access",
        description: "Control role permissions.",
      },
      {
        key: "settings",
        label: "Settings",
        description: "Update platform settings.",
      },
    ],
  },
];

export const ALL_ADMIN_ACCESS_KEYS = ADMIN_MENU_OPTIONS.flatMap((group) =>
  group.items.map((item) => item.key),
);

export const DEFAULT_ADMINS = [
  {
    id: "super-admin",
    name: "Tanvir Badsha",
    phone: "+880 1711-000000",
    email: "tanvir@exambuzz.com",
    address: "Dhaka, Bangladesh",
    imageUrl: "",
    role: "super_admin",
    accessKeys: ALL_ADMIN_ACCESS_KEYS,
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "admin-courses",
    name: "Nusrat Jahan",
    phone: "+880 1812-345678",
    email: "nusrat@exambuzz.com",
    address: "Mirpur, Dhaka",
    imageUrl: "",
    role: "sub_admin",
    accessKeys: ["dashboard", "courses", "teachers", "students"],
    createdAt: "2026-06-21T00:00:00.000Z",
  },
  {
    id: "admin-exams",
    name: "Rafi Ahmed",
    phone: "+880 1913-456789",
    email: "rafi@exambuzz.com",
    address: "Chattogram, Bangladesh",
    imageUrl: "",
    role: "sub_admin",
    accessKeys: ["dashboard", "exams", "question-bank", "exam-results"],
    createdAt: "2026-06-21T00:00:00.000Z",
  },
];

export function getRoleLabel(role) {
  return role === "super_admin" ? "Super Admin" : "Sub Admin";
}

export function getAdminInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function createAdminId() {
  return `admin-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
