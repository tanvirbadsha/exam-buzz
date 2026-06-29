export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
};

export const AUTH_TOKEN_COOKIE_NAME = "exam_buzz_auth_token";

export const PROTECTED_ROUTES = {
  "/admin": [ROLES.ADMIN],
  "/admin/(.*)": [ROLES.ADMIN],
  "/teacher": [ROLES.TEACHER, ROLES.ADMIN],
  "/teacher/(.*)": [ROLES.TEACHER, ROLES.ADMIN],
  "/student": [ROLES.STUDENT, ROLES.ADMIN],
  "/student/(.*)": [ROLES.STUDENT, ROLES.ADMIN],
  "/dashboard": [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
};

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/unauthorized",
];

export const LOGIN_REDIRECT = "/login";
export const UNAUTHORIZED_REDIRECT = "/unauthorized";
