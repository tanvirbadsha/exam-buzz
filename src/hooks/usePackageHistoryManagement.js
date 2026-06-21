"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_PACKAGE_HISTORY,
  PACKAGE_HISTORY_STORAGE_KEY,
} from "@/lib/packageHistoryData";

let cachedRawHistory = null;
let cachedHistory = DEFAULT_PACKAGE_HISTORY;

function readPackageHistorySnapshot() {
  if (typeof window === "undefined") return DEFAULT_PACKAGE_HISTORY;

  const storedValue = window.localStorage.getItem(PACKAGE_HISTORY_STORAGE_KEY);
  if (!storedValue) {
    cachedRawHistory = null;
    cachedHistory = DEFAULT_PACKAGE_HISTORY;
    return cachedHistory;
  }

  if (storedValue === cachedRawHistory) {
    return cachedHistory;
  }

  cachedRawHistory = storedValue;

  try {
    const parsedHistory = JSON.parse(storedValue);
    if (!Array.isArray(parsedHistory)) {
      cachedHistory = DEFAULT_PACKAGE_HISTORY;
      return cachedHistory;
    }

    cachedHistory = parsedHistory;
    return cachedHistory;
  } catch {
    cachedHistory = DEFAULT_PACKAGE_HISTORY;
    return cachedHistory;
  }
}

function writePackageHistorySnapshot(history) {
  if (typeof window === "undefined") return;

  const nextRawHistory = JSON.stringify(history);
  cachedRawHistory = nextRawHistory;
  cachedHistory = history;
  window.localStorage.setItem(PACKAGE_HISTORY_STORAGE_KEY, nextRawHistory);
}

function emitPackageHistoryStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-package-history-change"));
}

function subscribeToPackageHistoryStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-package-history-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-package-history-change", onStoreChange);
  };
}

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

export function usePackageHistoryManagement(studentId) {
  const history = useSyncExternalStore(
    subscribeToPackageHistoryStore,
    readPackageHistorySnapshot,
    () => DEFAULT_PACKAGE_HISTORY,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const studentHistory = useMemo(
    () => history.filter((item) => item.studentId === studentId),
    [history, studentId],
  );

  const deletePackageHistory = useCallback(
    (historyId) => {
      const targetHistory = history.find((item) => item.id === historyId);
      if (!targetHistory) return false;

      writePackageHistorySnapshot(
        history.filter((item) => item.id !== historyId),
      );
      emitPackageHistoryStoreChange();
      return true;
    },
    [history],
  );

  return {
    deletePackageHistory,
    history: studentHistory,
    isLoaded,
  };
}
