import { normalizeSubjects } from "@/features/subjects/subjectUtils";

export const ALL_SUBJECTS_VALUE = "all";

export function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

export function getTopicsFromResponse(response) {
  return Array.isArray(response?.topics) ? response.topics : [];
}

export function getTotalFromResponse(response, fallbackCount) {
  return (
    response?.total ??
    response?.totalItems ??
    response?.pagination?.total ??
    response?.meta?.total ??
    fallbackCount
  );
}

function buildChildrenMap(subjects) {
  const childrenMap = new Map();
  const subjectIds = new Set(subjects.map((subject) => String(subject.id)));

  subjects.forEach((subject) => {
    const parentKey =
      subject.parentId && subjectIds.has(String(subject.parentId))
        ? String(subject.parentId)
        : "root";
    const children = childrenMap.get(parentKey) || [];
    children.push(subject);
    childrenMap.set(parentKey, children);
  });

  return childrenMap;
}

export function buildSubjectOptions(subjects) {
  const subjectsById = new Map();

  normalizeSubjects(subjects).forEach((subject) => {
    if (!subject?.id) return;
    subjectsById.set(String(subject.id), subject);
  });

  const normalizedSubjects = Array.from(subjectsById.values());
  const childrenMap = buildChildrenMap(normalizedSubjects);
  const options = [];
  const visitedIds = new Set();

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((subject) => {
      const subjectId = String(subject.id);
      if (visitedIds.has(subjectId)) return;

      visitedIds.add(subjectId);
      const path = [...parentPath, subject.name];
      options.push({
        label: subject.name,
        value: subject.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(subjectId, depth + 1, path);
    });
  };

  walk();

  sortByName(normalizedSubjects).forEach((subject) => {
    const subjectId = String(subject.id);
    if (visitedIds.has(subjectId)) return;

    visitedIds.add(subjectId);
    options.push({
      label: subject.name,
      value: subject.id,
      depth: 0,
      meta: subject.name,
      searchText: subject.name,
    });
  });

  return options;
}

export function getSubjectFilterOptions(subjectOptions) {
  return [
    {
      label: "All subjects",
      value: ALL_SUBJECTS_VALUE,
      depth: 0,
      meta: "All subjects",
      searchText: "All subjects",
    },
    ...subjectOptions,
  ];
}
