"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  NOTICE_BOARD_STORAGE_KEY,
  createNoticeId,
} from "@/lib/noticeBoardData";

let cachedRawNotices = null;
let cachedNotices = null;

function parseNoticeList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedNotices = JSON.parse(storedValue);
    return Array.isArray(parsedNotices) ? parsedNotices : null;
  } catch {
    return null;
  }
}

function mergeWithInitialNotices(storedNotices, initialNotices) {
  if (!storedNotices) return initialNotices;

  const storedNoticeIds = new Set(storedNotices.map((notice) => notice.id));
  const missingInitialNotices = initialNotices.filter(
    (notice) => !storedNoticeIds.has(notice.id),
  );

  return [...missingInitialNotices, ...storedNotices];
}

function readNoticeSnapshot(initialNotices) {
  if (typeof window === "undefined") return initialNotices;

  const storedValue = window.localStorage.getItem(NOTICE_BOARD_STORAGE_KEY);
  if (!storedValue) {
    cachedRawNotices = null;
    cachedNotices = initialNotices;
    return cachedNotices;
  }

  if (storedValue === cachedRawNotices && cachedNotices) {
    return cachedNotices;
  }

  const parsedNotices = parseNoticeList(storedValue);
  cachedRawNotices = storedValue;
  cachedNotices = mergeWithInitialNotices(parsedNotices, initialNotices);
  return cachedNotices;
}

function subscribeToNoticeStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-notice-board-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-notice-board-change", onStoreChange);
  };
}

function emitNoticeStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-notice-board-change"));
}

function normalizeNotice(noticeInput, currentNotice = {}) {
  return {
    ...currentNotice,
    id: currentNotice.id || createNoticeId(),
    title: noticeInput.title.trim(),
    description: noticeInput.description || "<p></p>",
    status: noticeInput.status || "inactive",
    createdAt: currentNotice.createdAt || new Date().toISOString(),
    updatedAt: currentNotice.id ? new Date().toISOString() : undefined,
  };
}

export function useNoticeBoardManagement(initialNotices) {
  const getSnapshot = useCallback(
    () => readNoticeSnapshot(initialNotices),
    [initialNotices],
  );

  const notices = useSyncExternalStore(
    subscribeToNoticeStore,
    getSnapshot,
    () => initialNotices,
  );

  const persistNotices = useCallback((nextNotices) => {
    cachedRawNotices = JSON.stringify(nextNotices);
    cachedNotices = nextNotices;
    window.localStorage.setItem(NOTICE_BOARD_STORAGE_KEY, cachedRawNotices);
    emitNoticeStoreChange();
  }, []);

  const createNotice = useCallback(
    (noticeInput) => {
      const nextNotice = normalizeNotice(noticeInput);
      persistNotices([nextNotice, ...notices]);
      return nextNotice;
    },
    [notices, persistNotices],
  );

  const updateNotice = useCallback(
    (noticeId, noticeInput) => {
      let updatedNotice = null;
      const nextNotices = notices.map((notice) => {
        if (notice.id !== noticeId) return notice;

        updatedNotice = normalizeNotice(noticeInput, notice);
        return updatedNotice;
      });

      persistNotices(nextNotices);
      return updatedNotice;
    },
    [notices, persistNotices],
  );

  const deleteNotice = useCallback(
    (noticeId) => {
      const targetNotice = notices.find((notice) => notice.id === noticeId);
      if (!targetNotice) return false;

      persistNotices(notices.filter((notice) => notice.id !== noticeId));
      return true;
    },
    [notices, persistNotices],
  );

  const updateNoticeStatus = useCallback(
    (noticeId, status) => {
      let updatedNotice = null;
      const nextNotices = notices.map((notice) => {
        if (notice.id !== noticeId) return notice;

        updatedNotice = {
          ...notice,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedNotice;
      });

      persistNotices(nextNotices);
      return updatedNotice;
    },
    [notices, persistNotices],
  );

  const totals = useMemo(
    () =>
      notices.reduce(
        (summary, notice) => ({
          total: summary.total + 1,
          active: summary.active + (notice.status === "active" ? 1 : 0),
          inactive: summary.inactive + (notice.status === "inactive" ? 1 : 0),
        }),
        { total: 0, active: 0, inactive: 0 },
      ),
    [notices],
  );

  return {
    createNotice,
    deleteNotice,
    notices,
    totals,
    updateNotice,
    updateNoticeStatus,
  };
}
