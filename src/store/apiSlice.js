import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearCredentials } from "@/store/authSlice";
import { clearAuthTokenCookie, getAuthTokenCookie } from "@/lib/auth";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token || getAuthTokenCookie();

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
    api.dispatch(apiSlice.util.resetApiState());

    if (typeof window !== "undefined") {
      clearAuthTokenCookie();

      if (window.location.pathname !== "/login") {
        const loginUrl = new URL("/login", window.location.origin);
        const callbackUrl = `${window.location.pathname}${window.location.search}`;

        loginUrl.searchParams.set("callbackUrl", callbackUrl);
        window.location.href = loginUrl.toString();
      }
    }
  }

  return result;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: ["User"],
  endpoints: () => ({}),
});
