import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiBaseUrl.replace(/\/+$/, "")}/`,
    credentials: "omit",
    prepareHeaders: (headers, { endpoint, getState }) => {
      const token = getState().auth.token;

      headers.set("Accept", "application/json");

      if (endpoint === "getMedicines" || endpoint === "getAllLocations") {
        headers.set("Accept-Encoding", "gzip");
      }

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
    "Pharmacy",
    "Location",
    "District",
    "Area",
    "Medicine",
    "MedicineType",
    "Generic",
    "Manufacturer",
    "PaymentMethod",
  ],
  endpoints: () => ({}),
});
