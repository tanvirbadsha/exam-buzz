import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { authReducer } from "./authSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
}
