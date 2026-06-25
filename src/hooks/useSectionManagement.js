"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_SECTIONS_RESPONSE,
  SECTION_STORAGE_KEY,
  createSectionId,
  getSectionExamId,
  getSectionStatus,
} from "@/lib/sectionData";

let cachedRawSections = null;
let cachedSections = DEFAULT_SECTIONS_RESPONSE.sections;

function parseSections(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedSections = JSON.parse(storedValue);
    return Array.isArray(parsedSections) ? parsedSections : null;
  } catch {
    return null;
  }
}

function mergeWithInitialSections(storedSections, initialSections) {
  if (!storedSections) return initialSections;

  const storedSectionIds = new Set(
    storedSections.map((section) => String(section.id)),
  );
  const missingInitialSections = initialSections.filter(
    (section) => !storedSectionIds.has(String(section.id)),
  );

  return [...missingInitialSections, ...storedSections];
}

function readSectionsSnapshot(initialSections) {
  if (typeof window === "undefined") return initialSections;

  const storedValue = window.localStorage.getItem(SECTION_STORAGE_KEY);
  if (!storedValue) {
    cachedRawSections = null;
    cachedSections = initialSections;
    return cachedSections;
  }

  if (storedValue === cachedRawSections) {
    return cachedSections;
  }

  cachedRawSections = storedValue;
  cachedSections = mergeWithInitialSections(
    parseSections(storedValue),
    initialSections,
  );
  return cachedSections;
}

function subscribeToSectionStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-sections-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-sections-change", onStoreChange);
  };
}

function emitSectionStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-sections-change"));
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

function findExam(exams, examID) {
  return exams.find((exam) => String(exam.id) === String(examID)) || null;
}

function normalizeSection(sectionInput, currentSection = {}, sections = [], exams = []) {
  const now = new Date().toISOString();
  const examID = sectionInput.examID ?? sectionInput.examId ?? getSectionExamId(currentSection);
  const selectedExam = sectionInput.exam || findExam(exams, examID) || currentSection.exam || null;
  const nextStatus =
    typeof sectionInput.status === "boolean"
      ? sectionInput.status
      : getSectionStatus(currentSection);

  return {
    ...currentSection,
    id: currentSection.id || createSectionId(sections),
    examID,
    name: sectionInput.name.trim(),
    maxPapers: Math.max(1, Number(sectionInput.maxPapers) || 1),
    status: nextStatus,
    createdAt: currentSection.createdAt || now,
    updatedAt: now,
    exam: selectedExam,
  };
}

export function useSectionManagement(initialSections, initialExams = []) {
  const getSectionsSnapshot = useCallback(
    () => readSectionsSnapshot(initialSections),
    [initialSections],
  );

  const sections = useSyncExternalStore(
    subscribeToSectionStore,
    getSectionsSnapshot,
    () => initialSections,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const persistSections = useCallback((nextSections) => {
    cachedRawSections = JSON.stringify(nextSections);
    cachedSections = nextSections;
    window.localStorage.setItem(SECTION_STORAGE_KEY, cachedRawSections);
    emitSectionStoreChange();
  }, []);

  const createSection = useCallback(
    (sectionInput) => {
      const nextSection = normalizeSection(
        sectionInput,
        {},
        sections,
        initialExams,
      );
      persistSections([nextSection, ...sections]);
      return nextSection;
    },
    [initialExams, persistSections, sections],
  );

  const updateSection = useCallback(
    (sectionId, sectionInput) => {
      let updatedSection = null;
      const nextSections = sections.map((section) => {
        if (String(section.id) !== String(sectionId)) return section;

        updatedSection = normalizeSection(
          sectionInput,
          section,
          sections,
          initialExams,
        );
        return updatedSection;
      });

      persistSections(nextSections);
      return updatedSection;
    },
    [initialExams, persistSections, sections],
  );

  const updateSectionStatus = useCallback(
    (sectionId, status) => {
      let updatedSection = null;
      const nextSections = sections.map((section) => {
        if (String(section.id) !== String(sectionId)) return section;

        updatedSection = {
          ...section,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedSection;
      });

      persistSections(nextSections);
      return updatedSection;
    },
    [persistSections, sections],
  );

  const deleteSection = useCallback(
    (sectionId) => {
      const targetSection = sections.find(
        (section) => String(section.id) === String(sectionId),
      );
      if (!targetSection) return null;

      persistSections(
        sections.filter((section) => String(section.id) !== String(sectionId)),
      );
      return targetSection;
    },
    [persistSections, sections],
  );

  const sectionsById = useMemo(
    () => new Map(sections.map((section) => [String(section.id), section])),
    [sections],
  );

  const totals = useMemo(
    () =>
      sections.reduce(
        (summary, section) => ({
          total: summary.total + 1,
          active: summary.active + (getSectionStatus(section) ? 1 : 0),
          inactive: summary.inactive + (getSectionStatus(section) ? 0 : 1),
        }),
        { total: 0, active: 0, inactive: 0 },
      ),
    [sections],
  );

  return {
    createSection,
    deleteSection,
    getSectionById: (sectionId) => sectionsById.get(String(sectionId)),
    isLoaded,
    sections,
    totals,
    updateSection,
    updateSectionStatus,
  };
}
