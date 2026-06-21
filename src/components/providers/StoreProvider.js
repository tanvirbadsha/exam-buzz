"use client";

/* eslint-disable react-hooks/refs */

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { AUTH_SESSION_TOKEN, SUPER_ADMIN_USER } from "@/lib/auth";
import { setCredentials } from "@/store/authSlice";
import { makeStore } from "@/store/store";

export function StoreProvider({ children, serverToken }) {
  const storeRef = useRef(null);
  const hydratedTokenRef = useRef(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  if (serverToken && hydratedTokenRef.current !== serverToken) {
    storeRef.current.dispatch(
      setCredentials({
        token: serverToken,
        user: serverToken === AUTH_SESSION_TOKEN ? SUPER_ADMIN_USER : null,
      }),
    );
    hydratedTokenRef.current = serverToken;
  }

  useEffect(() => setupListeners(storeRef.current.dispatch), []);

  return (
    <Provider store={storeRef.current}>
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
