import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const LOGIN_TOAST_KEY = "exam-buzz-login-toast";

function getSecureCookieAttribute() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function setAuthTokenCookie(token) {
  if (typeof document === "undefined" || !token) return;

  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${getSecureCookieAttribute()}`;
}

export function getAuthTokenCookie() {
  if (typeof document === "undefined") return null;

  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE_NAME}=`));

  if (!tokenCookie) return null;

  return decodeURIComponent(tokenCookie.split("=").slice(1).join("="));
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${getSecureCookieAttribute()}`;
}
