"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_EXAM_TYPES_RESPONSE,
  EXAM_TYPE_STORAGE_KEY,
  createExamTypeId,
} from "@/lib/examTypeData";

let cachedRawExamTypes = null;
let cachedExamTypes = DEFAULT_EXAM_TYPES_RESPONSE.examTypes;

function parseExamTypes(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedItems = JSON.parse(storedValue);
    return Array.isArray(parsedItems) ? parsedItems : null;
  } catch {
    return null;
  }
}

function readExamTypesSnapshot(initialExamTypes) {
  if (typeof window === "undefined") return initialExamTypes;

  const storedValue = window.localStorage.getItem(EXAM_TYPE_STORAGE_KEY);
  if (!storedValue) {
    cachedRawExamTypes = null;
    cachedExamTypes = initialExamTypes;
    return cachedExamTypes;
  }

  if (storedValue === cachedRawExamTypes) {
    return cachedExamTypes;
  }

  cachedRawExamTypes = storedValue;
  cachedExamTypes = parseExamTypes(storedValue) || initialExamTypes;
  return cachedExamTypes;
}

function subscribeToExamTypeStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-exam-types-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-exam-types-change", onStoreChange);
  };
}

function emitExamTypeStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-exam-types-change"));
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

function normalizeExamType(examTypeInput, currentExamType = {}, examTypes = []) {
  const now = new Date().toISOString();
  const name = examTypeInput.name.trim();
  const rawIcon = examTypeInput.icon;
  const icon =
    typeof rawIcon === "string" && rawIcon.trim() ? rawIcon.trim() : null;

  return {
    ...currentExamType,
    id: currentExamType.id || createExamTypeId(examTypes),
    name,
    icon,
    createdAt: currentExamType.createdAt || now,
    updatedAt: now,
  };
}

export function useExamTypeManagement(initialExamTypes) {
  const getExamTypesSnapshot = useCallback(
    () => readExamTypesSnapshot(initialExamTypes),
    [initialExamTypes],
  );

  const examTypes = useSyncExternalStore(
    subscribeToExamTypeStore,
    getExamTypesSnapshot,
    () => initialExamTypes,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const persistExamTypes = useCallback((nextExamTypes) => {
    cachedRawExamTypes = JSON.stringify(nextExamTypes);
    cachedExamTypes = nextExamTypes;
    window.localStorage.setItem(EXAM_TYPE_STORAGE_KEY, cachedRawExamTypes);
    emitExamTypeStoreChange();
  }, []);

  const createExamType = useCallback(
    (examTypeInput) => {
      const nextExamType = normalizeExamType(
        examTypeInput,
        {},
        examTypes,
      );
      persistExamTypes([nextExamType, ...examTypes]);
      return nextExamType;
    },
    [examTypes, persistExamTypes],
  );

  const updateExamType = useCallback(
    (examTypeId, examTypeInput) => {
      let updatedExamType = null;
      const nextExamTypes = examTypes.map((examType) => {
        if (String(examType.id) !== String(examTypeId)) return examType;

        updatedExamType = normalizeExamType(
          examTypeInput,
          examType,
          examTypes,
        );
        return updatedExamType;
      });

      persistExamTypes(nextExamTypes);
      return updatedExamType;
    },
    [examTypes, persistExamTypes],
  );

  const deleteExamType = useCallback(
    (examTypeId) => {
      const targetExamType = examTypes.find(
        (examType) => String(examType.id) === String(examTypeId),
      );
      if (!targetExamType) return null;

      persistExamTypes(
        examTypes.filter(
          (examType) => String(examType.id) !== String(examTypeId),
        ),
      );
      return targetExamType;
    },
    [examTypes, persistExamTypes],
  );

  const examTypesById = useMemo(
    () => new Map(examTypes.map((examType) => [String(examType.id), examType])),
    [examTypes],
  );

  return {
    createExamType,
    deleteExamType,
    examTypes,
    getExamTypeById: (examTypeId) => examTypesById.get(String(examTypeId)),
    isLoaded,
    updateExamType,
  };
}
