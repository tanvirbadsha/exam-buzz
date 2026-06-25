import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_TOKEN_STORAGE_KEY,
  ROLE_COOKIE_NAME,
} from "@/lib/auth/constants";
import { clearCredentials } from "@/store/authSlice";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token =
      getState().auth?.token ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
        : null);

    headers.set("Accept", "application/json");

    if (process.env.NEXT_PUBLIC_BASE_API_KEY) {
      headers.set("x-api-key", process.env.NEXT_PUBLIC_BASE_API_KEY);
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

async function baseQueryWithAuthGuard(args, api, extraOptions) {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && [401, 403].includes(result.error.status)) {
    api.dispatch(clearCredentials());

    if (typeof window !== "undefined") {
      document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
      document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; path=/; max-age=0`;
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }

  return result;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: ["User", "ExamType", "Category", "Topic", "Subject"],
  endpoints: () => ({}),
});
