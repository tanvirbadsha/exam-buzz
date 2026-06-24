import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_TOKEN_STORAGE_KEY,
  ROLE_COOKIE_NAME,
  ROLES,
} from "@/lib/auth/constants";
import { apiSlice } from "@/store/apiSlice";
import { clearCredentials, setCredentials } from "@/store/authSlice";

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthPayload(result) {
  const user = result?.user || result?.admin || null;
  const role =
    result?.role || user?.role || (result?.admin ? ROLES.ADMIN : null);
  const token = result?.token || null;

  return { user, role, token };
}

function setRoleCookie(role) {
  if (typeof window === "undefined" || !role) return;

  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=${ROLE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearRoleCookie() {
  if (typeof window === "undefined") return;

  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
}

function setAuthToken(token) {
  if (typeof window === "undefined" || !token) return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${ROLE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthToken() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/admin/login",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_data, { dispatch, queryFulfilled }) {
        try {
          const { data: responseData } = await queryFulfilled;
          const authPayload = getAuthPayload(responseData);

          dispatch(setCredentials(authPayload));
          setRoleCookie(authPayload.role);
          setAuthToken(authPayload.token);
        } catch {
          dispatch(clearCredentials());
          clearRoleCookie();
          clearAuthToken();
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Local logout should still complete if the server session is already gone.
        } finally {
          dispatch(clearCredentials());
          clearRoleCookie();
          clearAuthToken();
        }
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
