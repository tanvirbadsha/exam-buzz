"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  PACKAGE_ASSIGNMENT_STORAGE_KEY,
  createPackageAssignmentId,
} from "@/lib/packageAssignmentData";

let cachedRawAssignments = null;
let cachedAssignments = [];

function parseAssignments(storedValue) {
  if (!storedValue) return [];

  try {
    const parsedAssignments = JSON.parse(storedValue);
    return Array.isArray(parsedAssignments) ? parsedAssignments : [];
  } catch {
    return [];
  }
}

function readPackageAssignmentSnapshot() {
  if (typeof window === "undefined") return [];

  const storedValue = window.localStorage.getItem(
    PACKAGE_ASSIGNMENT_STORAGE_KEY,
  );

  if (storedValue === cachedRawAssignments) {
    return cachedAssignments;
  }

  cachedRawAssignments = storedValue;
  cachedAssignments = parseAssignments(storedValue);
  return cachedAssignments;
}

function writePackageAssignmentSnapshot(assignments) {
  if (typeof window === "undefined") return;

  const nextRawAssignments = JSON.stringify(assignments);
  cachedRawAssignments = nextRawAssignments;
  cachedAssignments = assignments;
  window.localStorage.setItem(
    PACKAGE_ASSIGNMENT_STORAGE_KEY,
    nextRawAssignments,
  );
}

function emitPackageAssignmentStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-package-assignments-change"));
}

function subscribeToPackageAssignmentStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(
    "exam-buzz-package-assignments-change",
    onStoreChange,
  );

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(
      "exam-buzz-package-assignments-change",
      onStoreChange,
    );
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

export function usePackageAssignmentManagement() {
  const assignments = useSyncExternalStore(
    subscribeToPackageAssignmentStore,
    readPackageAssignmentSnapshot,
    () => [],
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const createAssignment = useCallback(
    (assignmentInput) => {
      const nextAssignment = {
        ...assignmentInput,
        id: createPackageAssignmentId(),
        assignedAt: new Date().toISOString(),
      };
      const nextAssignments = [nextAssignment, ...assignments];

      writePackageAssignmentSnapshot(nextAssignments);
      emitPackageAssignmentStoreChange();
      return nextAssignment;
    },
    [assignments],
  );

  return {
    assignments,
    createAssignment,
    isLoaded,
  };
}
