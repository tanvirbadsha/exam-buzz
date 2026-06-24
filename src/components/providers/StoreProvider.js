"use client";

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "@/store/store";

export function StoreProvider({ children }) {
  useEffect(() => setupListeners(store.dispatch), []);

  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: {
            iconTheme: {
              primary: "#262262",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#e11d48",
              secondary: "#ffffff",
            },
          },
          style: {
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
            color: "#172033",
            fontSize: "14px",
            fontWeight: 600,
          },
        }}
      />
    </Provider>
  );
}
