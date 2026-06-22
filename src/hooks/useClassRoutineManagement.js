"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CLASS_ROUTINE_STORAGE_KEY,
  createRoutineId,
} from "@/lib/classRoutineData";

let cachedRawRoutines = null;
let cachedRoutines = null;

function parseRoutineList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedRoutines = JSON.parse(storedValue);
    return Array.isArray(parsedRoutines) ? parsedRoutines : null;
  } catch {
    return null;
  }
}

function mergeWithInitialRoutines(storedRoutines, initialRoutines) {
  if (!storedRoutines) return initialRoutines;

  const storedRoutineTypes = new Set(
    storedRoutines.map((routine) => routine.examType),
  );
  const missingInitialRoutines = initialRoutines.filter(
    (routine) => !storedRoutineTypes.has(routine.examType),
  );

  return [...missingInitialRoutines, ...storedRoutines];
}

function readRoutineSnapshot(initialRoutines) {
  if (typeof window === "undefined") return initialRoutines;

  const storedValue = window.localStorage.getItem(CLASS_ROUTINE_STORAGE_KEY);
  if (!storedValue) {
    cachedRawRoutines = null;
    cachedRoutines = initialRoutines;
    return cachedRoutines;
  }

  if (storedValue === cachedRawRoutines && cachedRoutines) {
    return cachedRoutines;
  }

  const parsedRoutines = parseRoutineList(storedValue);
  cachedRawRoutines = storedValue;
  cachedRoutines = mergeWithInitialRoutines(parsedRoutines, initialRoutines);
  return cachedRoutines;
}

function subscribeToRoutineStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-class-routine-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-class-routine-change", onStoreChange);
  };
}

function emitRoutineStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-class-routine-change"));
}

function normalizeRoutine(routineInput, currentRoutine = {}) {
  return {
    ...currentRoutine,
    id: currentRoutine.id || createRoutineId(routineInput.examType),
    examType: routineInput.examType,
    title: routineInput.title.trim(),
    status: routineInput.status || "inactive",
    fileName: routineInput.fileName,
    fileUrl: routineInput.fileUrl,
    fileSize: routineInput.fileSize || 0,
    updatedAt: new Date().toISOString(),
  };
}

export function useClassRoutineManagement(initialRoutines) {
  const getSnapshot = useCallback(
    () => readRoutineSnapshot(initialRoutines),
    [initialRoutines],
  );

  const routines = useSyncExternalStore(
    subscribeToRoutineStore,
    getSnapshot,
    () => initialRoutines,
  );

  const persistRoutines = useCallback((nextRoutines) => {
    cachedRawRoutines = JSON.stringify(nextRoutines);
    cachedRoutines = nextRoutines;
    window.localStorage.setItem(CLASS_ROUTINE_STORAGE_KEY, cachedRawRoutines);
    emitRoutineStoreChange();
  }, []);

  const upsertRoutine = useCallback(
    (routineInput) => {
      let savedRoutine = null;
      const hasExistingRoutine = routines.some(
        (routine) => routine.examType === routineInput.examType,
      );

      if (hasExistingRoutine) {
        const nextRoutines = routines.map((routine) => {
          if (routine.examType !== routineInput.examType) return routine;

          savedRoutine = normalizeRoutine(routineInput, routine);
          return savedRoutine;
        });
        persistRoutines(nextRoutines);
        return savedRoutine;
      }

      savedRoutine = normalizeRoutine(routineInput);
      persistRoutines([savedRoutine, ...routines]);
      return savedRoutine;
    },
    [persistRoutines, routines],
  );

  const deleteRoutine = useCallback(
    (examType) => {
      const targetRoutine = routines.find(
        (routine) => routine.examType === examType,
      );
      if (!targetRoutine) return false;

      persistRoutines(
        routines.filter((routine) => routine.examType !== examType),
      );
      return true;
    },
    [persistRoutines, routines],
  );

  const updateRoutineStatus = useCallback(
    (examType, status) => {
      let updatedRoutine = null;
      const nextRoutines = routines.map((routine) => {
        if (routine.examType !== examType) return routine;

        updatedRoutine = {
          ...routine,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedRoutine;
      });

      persistRoutines(nextRoutines);
      return updatedRoutine;
    },
    [persistRoutines, routines],
  );

  const routineByType = useMemo(() => {
    const routineMap = new Map();
    routines.forEach((routine) => routineMap.set(routine.examType, routine));
    return routineMap;
  }, [routines]);

  return {
    deleteRoutine,
    routineByType,
    routines,
    updateRoutineStatus,
    upsertRoutine,
  };
}
