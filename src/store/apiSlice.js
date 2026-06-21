import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl
  ? `${configuredApiBaseUrl.replace(/\/+$/, "")}/`
  : "/api/";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    credentials: "omit",
    prepareHeaders: (headers, { endpoint, getState }) => {
      const token = getState().auth?.token;

      headers.set("Accept", "application/json");

      if (process.env.NEXT_PUBLIC_API_KEY) {
        headers.set("x-api-key", process.env.NEXT_PUBLIC_API_KEY);
      }

      if (token) {
        headers.set("Authorization", token);
      }

      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "Course",
    "Exam",
    "Question",
    "Result",
    "User",
  ],
  endpoints: (builder) => ({
    healthCheck: builder.query({
      query: () => "health",
    }),
  }),
});

export const { useHealthCheckQuery } = apiSlice;
