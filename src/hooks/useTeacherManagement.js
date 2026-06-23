"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_TEACHERS,
  TEACHER_PERMISSION_OPTIONS,
  TEACHER_STORAGE_KEY,
  createTeacherId,
} from "@/lib/teacherData";

let cachedRawTeachers = null;
let cachedTeachers = DEFAULT_TEACHERS;

function readTeachersSnapshot() {
  if (typeof window === "undefined") return DEFAULT_TEACHERS;

  const storedValue = window.localStorage.getItem(TEACHER_STORAGE_KEY);
  if (!storedValue) {
    cachedRawTeachers = null;
    cachedTeachers = DEFAULT_TEACHERS;
    return cachedTeachers;
  }

  if (storedValue === cachedRawTeachers) {
    return cachedTeachers;
  }

  cachedRawTeachers = storedValue;

  try {
    const parsedTeachers = JSON.parse(storedValue);
    if (!Array.isArray(parsedTeachers)) {
      cachedTeachers = DEFAULT_TEACHERS;
      return cachedTeachers;
    }

    cachedTeachers = parsedTeachers;
    return cachedTeachers;
  } catch {
    cachedTeachers = DEFAULT_TEACHERS;
    return cachedTeachers;
  }
}

function writeTeachersSnapshot(teachers) {
  if (typeof window === "undefined") return;

  const nextRawTeachers = JSON.stringify(teachers);
  cachedRawTeachers = nextRawTeachers;
  cachedTeachers = teachers;
  window.localStorage.setItem(TEACHER_STORAGE_KEY, nextRawTeachers);
}

function emitTeacherStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-teachers-change"));
}

function subscribeToTeacherStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-teachers-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-teachers-change", onStoreChange);
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

function normalizePermissions(permissions) {
  const allowedPermissions = new Set(TEACHER_PERMISSION_OPTIONS);
  const requestedPermissions = Array.isArray(permissions)
    ? permissions
    : ["BCS"];

  const uniquePermissions = [...new Set(requestedPermissions)].filter(
    (permission) => allowedPermissions.has(permission),
  );

  return uniquePermissions.length > 0 ? uniquePermissions : ["BCS"];
}

function createFinancialSnapshot() {
  return {
    totalWithdrawal: 0,
    totalEarning: 0,
    pendingWithdrawal: 0,
    totalAssessment: 0,
    totalAssignPaper: 0,
    totalSubmittedPaper: 0,
  };
}

export function useTeacherManagement() {
  const teachers = useSyncExternalStore(
    subscribeToTeacherStore,
    readTeachersSnapshot,
    () => DEFAULT_TEACHERS,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const persistTeachers = useCallback((nextTeachers) => {
    writeTeachersSnapshot(nextTeachers);
    emitTeacherStoreChange();
  }, []);

  const createTeacher = useCallback(
    (teacherInput) => {
      const nextTeacher = {
        id: createTeacherId(),
        fullName: teacherInput.fullName.trim(),
        phone: teacherInput.phone.trim(),
        email: teacherInput.email.trim(),
        password: teacherInput.password,
        address: teacherInput.address.trim(),
        permissions: normalizePermissions(teacherInput.permissions),
        ...createFinancialSnapshot(),
        createdAt: new Date().toISOString(),
      };

      persistTeachers([...teachers, nextTeacher]);
      return nextTeacher;
    },
    [persistTeachers, teachers],
  );

  const updateTeacher = useCallback(
    (teacherId, teacherInput) => {
      const nextTeachers = teachers.map((teacher) => {
        if (teacher.id !== teacherId) return teacher;

        return {
          ...teacher,
          fullName: teacherInput.fullName.trim(),
          phone: teacherInput.phone.trim(),
          email: teacherInput.email.trim(),
          password: teacherInput.password,
          address: teacherInput.address.trim(),
          permissions: normalizePermissions(
            teacherInput.permissions ?? teacher.permissions,
          ),
        };
      });

      persistTeachers(nextTeachers);
      return nextTeachers.find((teacher) => teacher.id === teacherId);
    },
    [persistTeachers, teachers],
  );

  const deleteTeacher = useCallback(
    (teacherId) => {
      const targetTeacher = teachers.find((teacher) => teacher.id === teacherId);
      if (!targetTeacher) return false;

      persistTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
      return true;
    },
    [persistTeachers, teachers],
  );

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers],
  );

  return {
    createTeacher,
    deleteTeacher,
    getTeacherById: (teacherId) => teacherMap.get(teacherId),
    isLoaded,
    teachers,
    updateTeacher,
  };
}
