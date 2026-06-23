"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  SUBJECT_STORAGE_KEY,
  SUBJECT_TOPIC_STORAGE_KEY,
  createSubjectId,
  createTopicId,
} from "@/lib/subjectData";

let cachedRawSubjects = null;
let cachedSubjects = null;
let cachedRawTopics = null;
let cachedTopics = null;

function parseList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedItems = JSON.parse(storedValue);
    return Array.isArray(parsedItems) ? parsedItems : null;
  } catch {
    return null;
  }
}

function mergeWithInitialItems(storedItems, initialItems) {
  if (!storedItems) return initialItems;

  const storedItemIds = new Set(storedItems.map((item) => item.id));
  const missingInitialItems = initialItems.filter(
    (item) => !storedItemIds.has(item.id),
  );

  return [...missingInitialItems, ...storedItems];
}

function readSubjectsSnapshot(initialSubjects) {
  if (typeof window === "undefined") return initialSubjects;

  const storedValue = window.localStorage.getItem(SUBJECT_STORAGE_KEY);
  if (!storedValue) {
    cachedRawSubjects = null;
    cachedSubjects = initialSubjects;
    return cachedSubjects;
  }

  if (storedValue === cachedRawSubjects && cachedSubjects) {
    return cachedSubjects;
  }

  const parsedSubjects = parseList(storedValue);
  cachedRawSubjects = storedValue;
  cachedSubjects = mergeWithInitialItems(parsedSubjects, initialSubjects);
  return cachedSubjects;
}

function readTopicsSnapshot(initialTopics) {
  if (typeof window === "undefined") return initialTopics;

  const storedValue = window.localStorage.getItem(SUBJECT_TOPIC_STORAGE_KEY);
  if (!storedValue) {
    cachedRawTopics = null;
    cachedTopics = initialTopics;
    return cachedTopics;
  }

  if (storedValue === cachedRawTopics && cachedTopics) {
    return cachedTopics;
  }

  const parsedTopics = parseList(storedValue);
  cachedRawTopics = storedValue;
  cachedTopics = mergeWithInitialItems(parsedTopics, initialTopics);
  return cachedTopics;
}

function subscribeToSubjectStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-subjects-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-subjects-change", onStoreChange);
  };
}

function emitSubjectStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-subjects-change"));
}

function buildChildrenMap(subjects) {
  const childrenMap = new Map();

  subjects.forEach((subject) => {
    const parentKey = subject.parentId || "root";
    const children = childrenMap.get(parentKey) || [];
    children.push(subject);
    childrenMap.set(parentKey, children);
  });

  return childrenMap;
}

function getDescendantIds(subjects, subjectId) {
  const childrenMap = buildChildrenMap(subjects);
  const descendantIds = new Set();
  const stack = [...(childrenMap.get(subjectId) || [])];

  while (stack.length > 0) {
    const subject = stack.pop();
    if (!subject || descendantIds.has(subject.id)) continue;

    descendantIds.add(subject.id);
    stack.push(...(childrenMap.get(subject.id) || []));
  }

  return descendantIds;
}

function getSubjectPath(subjectsById, subjectId) {
  const path = [];
  const visitedIds = new Set();
  let currentSubject = subjectsById.get(subjectId);

  while (currentSubject && !visitedIds.has(currentSubject.id)) {
    path.unshift(currentSubject);
    visitedIds.add(currentSubject.id);
    currentSubject = currentSubject.parentId
      ? subjectsById.get(currentSubject.parentId)
      : null;
  }

  return path;
}

function normalizeSubject(subjectInput, currentSubject = {}) {
  const name = subjectInput.name.trim();

  return {
    ...currentSubject,
    id: currentSubject.id || createSubjectId(),
    name,
    icon: subjectInput.icon?.trim() || name.slice(0, 2).toUpperCase(),
    parentId: subjectInput.parentId || null,
    status: subjectInput.status || "active",
    createdAt: currentSubject.createdAt || new Date().toISOString(),
    updatedAt: currentSubject.id ? new Date().toISOString() : undefined,
  };
}

function normalizeTopic(topicInput, currentTopic = {}) {
  return {
    ...currentTopic,
    id: currentTopic.id || createTopicId(),
    subjectId: topicInput.subjectId,
    name: topicInput.name.trim(),
    status: topicInput.status || "active",
    createdAt: currentTopic.createdAt || new Date().toISOString(),
    updatedAt: currentTopic.id ? new Date().toISOString() : undefined,
  };
}

export function useSubjectManagement(initialSubjects, initialTopics) {
  const getSubjectsSnapshot = useCallback(
    () => readSubjectsSnapshot(initialSubjects),
    [initialSubjects],
  );
  const getTopicsSnapshot = useCallback(
    () => readTopicsSnapshot(initialTopics),
    [initialTopics],
  );

  const subjects = useSyncExternalStore(
    subscribeToSubjectStore,
    getSubjectsSnapshot,
    () => initialSubjects,
  );
  const topics = useSyncExternalStore(
    subscribeToSubjectStore,
    getTopicsSnapshot,
    () => initialTopics,
  );

  const persistSubjects = useCallback((nextSubjects) => {
    cachedRawSubjects = JSON.stringify(nextSubjects);
    cachedSubjects = nextSubjects;
    window.localStorage.setItem(SUBJECT_STORAGE_KEY, cachedRawSubjects);
    emitSubjectStoreChange();
  }, []);

  const persistTopics = useCallback((nextTopics) => {
    cachedRawTopics = JSON.stringify(nextTopics);
    cachedTopics = nextTopics;
    window.localStorage.setItem(SUBJECT_TOPIC_STORAGE_KEY, cachedRawTopics);
    emitSubjectStoreChange();
  }, []);

  const createSubject = useCallback(
    (subjectInput) => {
      const nextSubject = normalizeSubject(subjectInput);
      const nextSubjects = [nextSubject, ...subjects];
      persistSubjects(nextSubjects);
      return nextSubject;
    },
    [persistSubjects, subjects],
  );

  const updateSubject = useCallback(
    (subjectId, subjectInput) => {
      const targetSubject = subjects.find((subject) => subject.id === subjectId);
      if (!targetSubject) return null;

      const descendantIds = getDescendantIds(subjects, subjectId);
      const requestedParentId = subjectInput.parentId || null;
      const parentId =
        requestedParentId === subjectId || descendantIds.has(requestedParentId)
          ? targetSubject.parentId
          : requestedParentId;

      let updatedSubject = null;
      const nextSubjects = subjects.map((subject) => {
        if (subject.id !== subjectId) return subject;

        updatedSubject = normalizeSubject(
          { ...subjectInput, parentId },
          subject,
        );
        return updatedSubject;
      });

      persistSubjects(nextSubjects);
      return updatedSubject;
    },
    [persistSubjects, subjects],
  );

  const deleteSubject = useCallback(
    (subjectId) => {
      const targetSubject = subjects.find((subject) => subject.id === subjectId);
      if (!targetSubject) return null;

      const subjectIdsToDelete = getDescendantIds(subjects, subjectId);
      subjectIdsToDelete.add(subjectId);
      const deletedTopicCount = topics.filter((topic) =>
        subjectIdsToDelete.has(topic.subjectId),
      ).length;

      persistSubjects(
        subjects.filter((subject) => !subjectIdsToDelete.has(subject.id)),
      );
      persistTopics(
        topics.filter((topic) => !subjectIdsToDelete.has(topic.subjectId)),
      );

      return {
        deletedCount: subjectIdsToDelete.size,
        deletedTopicCount,
        subject: targetSubject,
      };
    },
    [persistSubjects, persistTopics, subjects, topics],
  );

  const updateSubjectStatus = useCallback(
    (subjectId, status) => {
      let updatedSubject = null;
      const nextSubjects = subjects.map((subject) => {
        if (subject.id !== subjectId) return subject;

        updatedSubject = {
          ...subject,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedSubject;
      });

      persistSubjects(nextSubjects);
      return updatedSubject;
    },
    [persistSubjects, subjects],
  );

  const createTopics = useCallback(
    (subjectId, topicInputs) => {
      const nextTopics = topicInputs
        .map((topicInput) => normalizeTopic({ ...topicInput, subjectId }))
        .filter((topic) => topic.name);

      if (nextTopics.length === 0) return [];

      persistTopics([...nextTopics, ...topics]);
      return nextTopics;
    },
    [persistTopics, topics],
  );

  const updateTopic = useCallback(
    (topicId, topicInput) => {
      let updatedTopic = null;
      const nextTopics = topics.map((topic) => {
        if (topic.id !== topicId) return topic;

        updatedTopic = normalizeTopic(
          { ...topic, ...topicInput, subjectId: topic.subjectId },
          topic,
        );
        return updatedTopic;
      });

      persistTopics(nextTopics);
      return updatedTopic;
    },
    [persistTopics, topics],
  );

  const deleteTopic = useCallback(
    (topicId) => {
      const targetTopic = topics.find((topic) => topic.id === topicId);
      if (!targetTopic) return null;

      persistTopics(topics.filter((topic) => topic.id !== topicId));
      return targetTopic;
    },
    [persistTopics, topics],
  );

  const updateTopicStatus = useCallback(
    (topicId, status) => {
      let updatedTopic = null;
      const nextTopics = topics.map((topic) => {
        if (topic.id !== topicId) return topic;

        updatedTopic = {
          ...topic,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedTopic;
      });

      persistTopics(nextTopics);
      return updatedTopic;
    },
    [persistTopics, topics],
  );

  const subjectIndex = useMemo(() => {
    const subjectsById = new Map(
      subjects.map((subject) => [subject.id, subject]),
    );
    const childrenMap = buildChildrenMap(subjects);
    const directChildCounts = new Map();
    const descendantCounts = new Map();
    const topicCounts = new Map();

    subjects.forEach((subject) => {
      directChildCounts.set(subject.id, childrenMap.get(subject.id)?.length || 0);
      descendantCounts.set(subject.id, getDescendantIds(subjects, subject.id).size);
      topicCounts.set(
        subject.id,
        topics.filter((topic) => topic.subjectId === subject.id).length,
      );
    });

    return {
      childrenMap,
      directChildCounts,
      descendantCounts,
      subjectsById,
      topicCounts,
    };
  }, [subjects, topics]);

  const topicsBySubjectId = useMemo(() => {
    const groupedTopics = new Map();

    topics.forEach((topic) => {
      const currentTopics = groupedTopics.get(topic.subjectId) || [];
      currentTopics.push(topic);
      groupedTopics.set(topic.subjectId, currentTopics);
    });

    return groupedTopics;
  }, [topics]);

  const totals = useMemo(
    () =>
      subjects.reduce(
        (summary, subject) => ({
          total: summary.total + 1,
          root: summary.root + (subject.parentId ? 0 : 1),
          active: summary.active + (subject.status === "active" ? 1 : 0),
          topics: summary.topics,
        }),
        {
          total: 0,
          root: 0,
          active: 0,
          topics: topics.length,
        },
      ),
    [subjects, topics.length],
  );

  return {
    createSubject,
    createTopics,
    deleteSubject,
    deleteTopic,
    subjectIndex,
    subjects,
    topics,
    topicsBySubjectId,
    totals,
    updateSubject,
    updateSubjectStatus,
    updateTopic,
    updateTopicStatus,
  };
}
