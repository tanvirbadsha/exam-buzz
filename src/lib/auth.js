export const AUTH_COOKIE_NAME = "exam_buzz_auth";
export const AUTH_SESSION_TOKEN = "exam-buzz-super-admin";
export const LOGIN_TOAST_KEY = "exam-buzz-login-toast";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8;

export const SUPER_ADMIN_CREDENTIALS = {
  email: "admin@example.com",
  password: "123456",
};

export const SUPER_ADMIN_USER = {
  name: "Tanvir Badsha",
  email: SUPER_ADMIN_CREDENTIALS.email,
  role: "Super Admin",
};

export function isValidSuperAdminLogin({ email, password }) {
  return (
    email.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.email &&
    password === SUPER_ADMIN_CREDENTIALS.password
  );
}

export function createAuthCookieValue() {
  return `${AUTH_COOKIE_NAME}=${AUTH_SESSION_TOKEN}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=lax`;
}

export function createExpiredAuthCookieValue() {
  return `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
