"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  RECORD_CLASS_STORAGE_KEY,
  createRecordClassId,
} from "@/lib/recordClassData";

let cachedRawRecordClasses = null;
let cachedRecordClasses = null;

function parseRecordClassList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedRecordClasses = JSON.parse(storedValue);
    return Array.isArray(parsedRecordClasses) ? parsedRecordClasses : null;
  } catch {
    return null;
  }
}

function mergeWithInitialRecordClasses(storedRecordClasses, initialRecordClasses) {
  if (!storedRecordClasses) return initialRecordClasses;

  const storedRecordClassIds = new Set(
    storedRecordClasses.map((recordClass) => recordClass.id),
  );
  const missingInitialRecordClasses = initialRecordClasses.filter(
    (recordClass) => !storedRecordClassIds.has(recordClass.id),
  );

  return [...missingInitialRecordClasses, ...storedRecordClasses];
}

function readRecordClassSnapshot(initialRecordClasses) {
  if (typeof window === "undefined") return initialRecordClasses;

  const storedValue = window.localStorage.getItem(RECORD_CLASS_STORAGE_KEY);
  if (!storedValue) {
    cachedRawRecordClasses = null;
    cachedRecordClasses = initialRecordClasses;
    return cachedRecordClasses;
  }

  if (storedValue === cachedRawRecordClasses && cachedRecordClasses) {
    return cachedRecordClasses;
  }

  const parsedRecordClasses = parseRecordClassList(storedValue);
  cachedRawRecordClasses = storedValue;
  cachedRecordClasses = mergeWithInitialRecordClasses(
    parsedRecordClasses,
    initialRecordClasses,
  );
  return cachedRecordClasses;
}

function subscribeToRecordClassStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-record-classes-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(
      "exam-buzz-record-classes-change",
      onStoreChange,
    );
  };
}

function emitRecordClassStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-record-classes-change"));
}

function normalizeRecordClass(recordClassInput, currentRecordClass = {}) {
  return {
    ...currentRecordClass,
    id: currentRecordClass.id || createRecordClassId(),
    title: recordClassInput.title.trim(),
    categoryId: recordClassInput.categoryId,
    subjectId: recordClassInput.subjectId,
    materialFolderId: recordClassInput.materialFolderId || "",
    examId: recordClassInput.examId || "",
    publishAt: recordClassInput.publishAt,
    youtubeUrl: recordClassInput.youtubeUrl.trim(),
    createdAt: currentRecordClass.createdAt || new Date().toISOString(),
    updatedAt: currentRecordClass.id ? new Date().toISOString() : undefined,
  };
}

export function useRecordClassManagement(initialRecordClasses) {
  const getSnapshot = useCallback(
    () => readRecordClassSnapshot(initialRecordClasses),
    [initialRecordClasses],
  );

  const recordClasses = useSyncExternalStore(
    subscribeToRecordClassStore,
    getSnapshot,
    () => initialRecordClasses,
  );

  const persistRecordClasses = useCallback((nextRecordClasses) => {
    cachedRawRecordClasses = JSON.stringify(nextRecordClasses);
    cachedRecordClasses = nextRecordClasses;
    window.localStorage.setItem(RECORD_CLASS_STORAGE_KEY, cachedRawRecordClasses);
    emitRecordClassStoreChange();
  }, []);

  const createRecordClass = useCallback(
    (recordClassInput) => {
      const nextRecordClass = normalizeRecordClass(recordClassInput);
      persistRecordClasses([nextRecordClass, ...recordClasses]);
      return nextRecordClass;
    },
    [persistRecordClasses, recordClasses],
  );

  const updateRecordClass = useCallback(
    (recordClassId, recordClassInput) => {
      let updatedRecordClass = null;
      const nextRecordClasses = recordClasses.map((recordClass) => {
        if (recordClass.id !== recordClassId) return recordClass;

        updatedRecordClass = normalizeRecordClass(
          recordClassInput,
          recordClass,
        );
        return updatedRecordClass;
      });

      persistRecordClasses(nextRecordClasses);
      return updatedRecordClass;
    },
    [persistRecordClasses, recordClasses],
  );

  const deleteRecordClass = useCallback(
    (recordClassId) => {
      const targetRecordClass = recordClasses.find(
        (recordClass) => recordClass.id === recordClassId,
      );
      if (!targetRecordClass) return false;

      persistRecordClasses(
        recordClasses.filter((recordClass) => recordClass.id !== recordClassId),
      );
      return true;
    },
    [persistRecordClasses, recordClasses],
  );

  const totals = useMemo(
    () =>
      recordClasses.reduce(
        (summary, recordClass) => ({
          total: summary.total + 1,
          linkedToExam: summary.linkedToExam + (recordClass.examId ? 1 : 0),
          withoutExam: summary.withoutExam + (recordClass.examId ? 0 : 1),
        }),
        { total: 0, linkedToExam: 0, withoutExam: 0 },
      ),
    [recordClasses],
  );

  return {
    createRecordClass,
    deleteRecordClass,
    recordClasses,
    totals,
    updateRecordClass,
  };
}
