"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { EXAM_STORAGE_KEY, createExamId, getExamCategoryId } from "@/lib/examData";

let cachedRawExams = null;
let cachedExams = null;

function parseExamList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedExams = JSON.parse(storedValue);
    return Array.isArray(parsedExams) ? parsedExams : null;
  } catch {
    return null;
  }
}

function mergeWithInitialExams(storedExams, initialExams) {
  if (!storedExams) return initialExams;

  const storedExamIds = new Set(storedExams.map((exam) => String(exam.id)));
  const missingInitialExams = initialExams.filter(
    (exam) => !storedExamIds.has(String(exam.id)),
  );

  return [...missingInitialExams, ...storedExams];
}

function readExamSnapshot(initialExams) {
  if (typeof window === "undefined") return initialExams;

  const storedValue = window.localStorage.getItem(EXAM_STORAGE_KEY);
  if (!storedValue) {
    cachedRawExams = null;
    cachedExams = initialExams;
    return cachedExams;
  }

  if (storedValue === cachedRawExams && cachedExams) {
    return cachedExams;
  }

  const parsedExams = parseExamList(storedValue);
  cachedRawExams = storedValue;
  cachedExams = mergeWithInitialExams(parsedExams, initialExams);
  return cachedExams;
}

function subscribeToExamStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-exams-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-exams-change", onStoreChange);
  };
}

function emitExamStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-exams-change"));
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizeExam(examInput, currentExam = {}) {
  const categoryId = String(
    examInput.categoryId ?? examInput.categoryID ?? getExamCategoryId(currentExam),
  );
  const nextStatus =
    typeof examInput.status === "boolean"
      ? examInput.status
      : typeof currentExam.status === "boolean"
        ? currentExam.status
        : true;

  return {
    ...currentExam,
    id: currentExam.id || createExamId(),
    name: examInput.name.trim(),
    categoryId,
    categoryID: categoryId,
    subjectIds: normalizeIdList(examInput.subjectIds),
    topicIds: normalizeIdList(examInput.topicIds),
    durationIntMinutes: Math.max(0, Number(examInput.durationIntMinutes) || 0),
    passMark: Math.max(0, Number(examInput.passMark) || 0),
    publishedDate: examInput.publishedDate.trim(),
    publishedTime: examInput.publishedTime.trim(),
    expiredDate: examInput.expiredDate.trim(),
    expiredTime: examInput.expiredTime.trim(),
    questionPDF: examInput.questionPDF || "",
    questionPDFName: examInput.questionPDFName || "",
    demoAnswerPDF: examInput.demoAnswerPDF || "",
    demoAnswerPDFName: examInput.demoAnswerPDFName || "",
    packageId: examInput.packageId || "",
    status: nextStatus,
    category: examInput.category || currentExam.category,
    createdAt: currentExam.createdAt || new Date().toISOString(),
    updatedAt: currentExam.id ? new Date().toISOString() : currentExam.updatedAt,
  };
}

export function useExamManagement(initialExams) {
  const getSnapshot = useCallback(
    () => readExamSnapshot(initialExams),
    [initialExams],
  );

  const exams = useSyncExternalStore(
    subscribeToExamStore,
    getSnapshot,
    () => initialExams,
  );

  const persistExams = useCallback((nextExams) => {
    cachedRawExams = JSON.stringify(nextExams);
    cachedExams = nextExams;
    window.localStorage.setItem(EXAM_STORAGE_KEY, cachedRawExams);
    emitExamStoreChange();
  }, []);

  const createExam = useCallback(
    (examInput) => {
      const nextExam = normalizeExam(examInput);
      persistExams([nextExam, ...exams]);
      return nextExam;
    },
    [exams, persistExams],
  );

  const updateExam = useCallback(
    (examId, examInput) => {
      let updatedExam = null;
      const nextExams = exams.map((exam) => {
        if (String(exam.id) !== String(examId)) return exam;

        updatedExam = normalizeExam(examInput, exam);
        return updatedExam;
      });

      persistExams(nextExams);
      return updatedExam;
    },
    [exams, persistExams],
  );

  const updateExamStatus = useCallback(
    (examId, status) => {
      let updatedExam = null;
      const nextExams = exams.map((exam) => {
        if (String(exam.id) !== String(examId)) return exam;

        updatedExam = {
          ...exam,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedExam;
      });

      persistExams(nextExams);
      return updatedExam;
    },
    [exams, persistExams],
  );

  const deleteExam = useCallback(
    (examId) => {
      const targetExam = exams.find((exam) => String(exam.id) === String(examId));
      if (!targetExam) return false;

      persistExams(exams.filter((exam) => String(exam.id) !== String(examId)));
      return true;
    },
    [exams, persistExams],
  );

  const examsById = useMemo(
    () => new Map(exams.map((exam) => [String(exam.id), exam])),
    [exams],
  );

  const totals = useMemo(
    () =>
      exams.reduce(
        (summary, exam) => ({
          total: summary.total + 1,
          active: summary.active + (exam.status ? 1 : 0),
          inactive: summary.inactive + (exam.status ? 0 : 1),
        }),
        { total: 0, active: 0, inactive: 0 },
      ),
    [exams],
  );

  return {
    createExam,
    deleteExam,
    exams,
    getExamById: (examId) => examsById.get(String(examId)),
    totals,
    updateExam,
    updateExamStatus,
  };
}
