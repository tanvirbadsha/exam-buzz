export function getApiErrorMessage(error, fallback = "Please try again.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.data?.message) return error.data.message;
  if (error.error) return error.error;
  if (error.message) return error.message;
  return fallback;
}

export function appendIfPresent(formData, key, value) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, value);
}

function appendIconFile(formData, file) {
  if (!file) return;

  formData.append("icon", file, file.name);
  formData.append("iconName", file.name);
}

export function normalizeSubject(subject) {
  if (!subject) return null;

  const rawStatus =
    typeof subject.status === "string"
      ? subject.status.toLowerCase()
      : subject.status;
  const status =
    rawStatus === true || rawStatus === "true" || rawStatus === "active"
      ? "active"
      : "inactive";
  const parentId =
    subject.parentId ?? subject.parentID ?? subject.parent?.id ?? null;

  return {
    ...subject,
    id: subject.id,
    parentId,
    parentID: parentId,
    name: subject.name || "",
    icon: subject.icon || "",
    status,
    children: (subject.children || []).map(normalizeSubject).filter(Boolean),
    topicCount: 0,
  };
}

export function normalizeSubjects(subjects) {
  return (subjects || []).map(normalizeSubject).filter(Boolean);
}

export function getSubjectChildrenCount(subject) {
  if (!subject) return 0;
  if (typeof subject.childrenCount === "number") return subject.childrenCount;
  if (typeof subject.childCount === "number") return subject.childCount;
  if (typeof subject.subSubjectCount === "number") return subject.subSubjectCount;
  if (Array.isArray(subject.children)) return subject.children.length;
  return 0;
}

export function getDirectChildCount(subject, subjects = []) {
  const apiCount = getSubjectChildrenCount(subject);

  if (apiCount > 0) {
    return apiCount;
  }

  return subjects.filter(
    (candidateSubject) =>
      String(candidateSubject.parentId ?? "") === String(subject.id),
  ).length;
}

export function getSubjectPagination(data, fallbackPage, fallbackLimit) {
  const pagination = data?.pagination || data?.meta || {};
  const total =
    pagination.total ??
    pagination.totalItems ??
    pagination.count ??
    data?.total ??
    data?.totalItems ??
    data?.count ??
    data?.subjects?.length ??
    0;
  const page = pagination.page ?? pagination.currentPage ?? fallbackPage;
  const limit = pagination.limit ?? pagination.perPage ?? fallbackLimit;

  return {
    total,
    page,
    limit,
    totalPages:
      pagination.totalPages ?? Math.ceil(total / Math.max(Number(limit) || 1, 1)),
  };
}

export function buildSubjectCreateFormData(subjectInput) {
  const formData = new FormData();

  appendIfPresent(formData, "name", subjectInput.name?.trim());
  appendIfPresent(formData, "parentID", subjectInput.parentId);
  appendIfPresent(formData, "status", subjectInput.status === "active");
  appendIconFile(formData, subjectInput.iconFile);

  return formData;
}

export function buildSubjectUpdateFormData(subjectInput, currentSubject) {
  const formData = new FormData();
  const nextName = subjectInput.name?.trim() || "";
  const nextParentId = subjectInput.parentId ?? null;
  const currentParentId = currentSubject?.parentId ?? null;

  if (nextName && nextName !== (currentSubject?.name || "")) {
    formData.append("name", nextName);
  }

  if (String(nextParentId ?? "") !== String(currentParentId ?? "")) {
    formData.append("parentID", nextParentId ?? "");
  }

  if (subjectInput.iconFile) {
    appendIconFile(formData, subjectInput.iconFile);
  } else if (subjectInput.iconRemoved && currentSubject?.icon) {
    formData.append("icon", "");
    formData.append("iconName", "");
  }

  return formData;
}
