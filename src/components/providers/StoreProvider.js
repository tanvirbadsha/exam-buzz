"use client";

/* eslint-disable react-hooks/refs */

import { setupListeners } from "@reduxjs/toolkit/query";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { setCredentials } from "@/store/authSlice";
import { makeStore } from "@/store/store";

export function StoreProvider({ children, serverToken }) {
  const storeRef = useRef(null);
  const hydratedTokenRef = useRef(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  if (serverToken && hydratedTokenRef.current !== serverToken) {
    storeRef.current.dispatch(setCredentials({ token: serverToken }));
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
          style: {
            border: "1px solid #d9e7df",
            color: "#1f2f27",
            fontSize: "14px",
          },
        }}
      />
    </Provider>
  );
}
