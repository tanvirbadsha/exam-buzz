"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_STUDENTS,
  STUDENT_GENDER_OPTIONS,
  STUDENT_PACKAGE_OPTIONS,
  STUDENT_STORAGE_KEY,
  createRegistrationId,
  createStudentId,
  createUserId,
} from "@/lib/studentData";

let cachedRawStudents = null;
let cachedStudents = DEFAULT_STUDENTS;

function readStudentsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_STUDENTS;

  const storedValue = window.localStorage.getItem(STUDENT_STORAGE_KEY);
  if (!storedValue) {
    cachedRawStudents = null;
    cachedStudents = DEFAULT_STUDENTS;
    return cachedStudents;
  }

  if (storedValue === cachedRawStudents) {
    return cachedStudents;
  }

  cachedRawStudents = storedValue;

  try {
    const parsedStudents = JSON.parse(storedValue);
    if (!Array.isArray(parsedStudents)) {
      cachedStudents = DEFAULT_STUDENTS;
      return cachedStudents;
    }

    cachedStudents = parsedStudents;
    return cachedStudents;
  } catch {
    cachedStudents = DEFAULT_STUDENTS;
    return cachedStudents;
  }
}

function writeStudentsSnapshot(students) {
  if (typeof window === "undefined") return;

  const nextRawStudents = JSON.stringify(students);
  cachedRawStudents = nextRawStudents;
  cachedStudents = students;
  window.localStorage.setItem(STUDENT_STORAGE_KEY, nextRawStudents);
}

function emitStudentStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-students-change"));
}

function subscribeToStudentStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-students-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-students-change", onStoreChange);
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

function normalizePackage(packageName) {
  const validPackages = new Set(
    STUDENT_PACKAGE_OPTIONS.filter((option) => option.value !== "all").map(
      (option) => option.value,
    ),
  );

  return validPackages.has(packageName) ? packageName : "BCS Complete";
}

function normalizeGender(gender) {
  const allowedGenders = new Set(
    STUDENT_GENDER_OPTIONS.map((option) => option.value),
  );

  return allowedGenders.has(gender) ? gender : "male";
}

function normalizeActiveStatus(status, fallback = true) {
  if (status === "active") return true;
  if (status === "inactive") return false;
  if (status === undefined || status === null || status === "") return fallback;
  return Boolean(status);
}

function parseCount(value) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) return 0;
  return Math.floor(parsedValue);
}

function parseAmount(value) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) return 0;
  return parsedValue;
}

export function useStudentManagement() {
  const students = useSyncExternalStore(
    subscribeToStudentStore,
    readStudentsSnapshot,
    () => DEFAULT_STUDENTS,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const persistStudents = useCallback((nextStudents) => {
    writeStudentsSnapshot(nextStudents);
    emitStudentStoreChange();
  }, []);

  const createStudent = useCallback(
    (studentInput) => {
      const nextStudent = {
        id: createStudentId(),
        name: studentInput.name.trim(),
        userId: studentInput.userId?.trim() || createUserId(),
        gender: normalizeGender(studentInput.gender),
        phone: studentInput.phone.trim(),
        password: studentInput.password || "",
        registrationId:
          studentInput.registrationId?.trim() || createRegistrationId(),
        purchasedPackage: normalizePackage(studentInput.purchasedPackage),
        purchasedPackageCount: parseCount(studentInput.purchasedPackageCount),
        purchaseAmount: parseAmount(studentInput.purchaseAmount),
        preliminaryExam: parseCount(studentInput.preliminaryExam),
        writtenExam: parseCount(studentInput.writtenExam),
        isActive: normalizeActiveStatus(studentInput.isActive, true),
        email: studentInput.email?.trim() || "",
        address: studentInput.address?.trim() || "",
        createdAt: new Date().toISOString(),
      };

      persistStudents([...students, nextStudent]);
      return nextStudent;
    },
    [persistStudents, students],
  );

  const updateStudent = useCallback(
    (studentId, studentInput) => {
      const nextStudents = students.map((student) => {
        if (student.id !== studentId) return student;

        return {
          ...student,
          name: studentInput.name.trim(),
          userId: studentInput.userId?.trim() || student.userId,
          gender: normalizeGender(studentInput.gender ?? student.gender),
          phone: studentInput.phone.trim(),
          password: studentInput.password ?? student.password ?? "",
          registrationId:
            studentInput.registrationId?.trim() || student.registrationId,
          purchasedPackage: normalizePackage(
            studentInput.purchasedPackage ?? student.purchasedPackage,
          ),
          purchasedPackageCount: parseCount(
            studentInput.purchasedPackageCount ?? student.purchasedPackageCount,
          ),
          purchaseAmount: parseAmount(
            studentInput.purchaseAmount ?? student.purchaseAmount,
          ),
          preliminaryExam: parseCount(
            studentInput.preliminaryExam ?? student.preliminaryExam,
          ),
          writtenExam: parseCount(studentInput.writtenExam ?? student.writtenExam),
          isActive: normalizeActiveStatus(studentInput.isActive, student.isActive),
          email: studentInput.email?.trim() || "",
          address: studentInput.address?.trim() || student.address || "",
        };
      });

      persistStudents(nextStudents);
      return nextStudents.find((student) => student.id === studentId);
    },
    [persistStudents, students],
  );

  const deleteStudent = useCallback(
    (studentId) => {
      const targetStudent = students.find((student) => student.id === studentId);
      if (!targetStudent) return false;

      persistStudents(students.filter((student) => student.id !== studentId));
      return true;
    },
    [persistStudents, students],
  );

  const updateStudentStatus = useCallback(
    (studentId, isActive) => {
      const nextStudents = students.map((student) =>
        student.id === studentId ? { ...student, isActive } : student,
      );

      persistStudents(nextStudents);
      return nextStudents.find((student) => student.id === studentId);
    },
    [persistStudents, students],
  );

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  return {
    createStudent,
    deleteStudent,
    getStudentById: (studentId) => studentMap.get(studentId),
    isLoaded,
    students,
    updateStudent,
    updateStudentStatus,
  };
}
