export function getExamApiErrorMessage(error, fallback = "Please try again.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.data?.message) return error.data.message;
  if (error.error) return error.error;
  if (error.message) return error.message;
  return fallback;
}

function toUiId(value) {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function toNullableUiId(value) {
  const id = toUiId(value);
  return id || null;
}

function toApiId(value) {
  const id = toUiId(value);
  if (!id) return undefined;
  return /^\d+$/.test(id) ? Number(id) : id;
}

function toApiIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(toApiId).filter((id) => id !== undefined);
}

function toUiIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(toUiId).filter(Boolean);
}

function getStatusBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalizedValue = value.toLowerCase();
    return normalizedValue === "true" || normalizedValue === "active";
  }
  return fallback;
}

function getNestedItems(item) {
  return [
    ...(Array.isArray(item?.children) ? item.children : []),
    ...(Array.isArray(item?.childrens) ? item.childrens : []),
    ...(Array.isArray(item?.subCategories) ? item.subCategories : []),
    ...(Array.isArray(item?.subcategories) ? item.subcategories : []),
    ...(Array.isArray(item?.subSubjects) ? item.subSubjects : []),
    ...(Array.isArray(item?.subjects) ? item.subjects : []),
  ];
}

export function normalizeExamCategory(category, fallbackParentId) {
  if (!category) return null;

  const parentId = toNullableUiId(
    fallbackParentId ??
      category.parentId ??
      category.parentID ??
      category.parent?.id,
  );

  return {
    ...category,
    id: toUiId(category.id),
    parentId,
    parentID: parentId,
    name: category.name || "",
    icon: category.icon || "",
    status: getStatusBoolean(category.status, false),
    isActive: getStatusBoolean(category.status, false),
    parent: category.parent
      ? normalizeExamCategory(category.parent)
      : category.parent,
  };
}

export function normalizeExamCategories(categories) {
  const categoriesById = new Map();

  const walk = (category, fallbackParentId = null) => {
    const normalizedCategory = normalizeExamCategory(category, fallbackParentId);
    if (!normalizedCategory?.id || categoriesById.has(normalizedCategory.id)) {
      return;
    }

    categoriesById.set(normalizedCategory.id, normalizedCategory);
    getNestedItems(category).forEach((childCategory) =>
      walk(childCategory, normalizedCategory.id),
    );
  };

  (categories || []).forEach((category) => walk(category));
  return Array.from(categoriesById.values());
}

export function normalizeExamSubject(subject, fallbackParentId) {
  if (!subject) return null;

  const parentId = toNullableUiId(
    fallbackParentId ??
      subject.parentId ??
      subject.parentID ??
      subject.parent?.id,
  );
  const status = getStatusBoolean(subject.status, true) ? "active" : "inactive";

  return {
    ...subject,
    id: toUiId(subject.id),
    parentId,
    parentID: parentId,
    name: subject.name || "",
    icon: subject.icon || "",
    status,
    parent: subject.parent
      ? normalizeExamSubject(subject.parent)
      : subject.parent,
  };
}

export function normalizeExamSubjects(subjects) {
  const subjectsById = new Map();

  const walk = (subject, fallbackParentId = null) => {
    const normalizedSubject = normalizeExamSubject(subject, fallbackParentId);
    if (!normalizedSubject?.id || subjectsById.has(normalizedSubject.id)) {
      return;
    }

    subjectsById.set(normalizedSubject.id, normalizedSubject);
    getNestedItems(subject).forEach((childSubject) =>
      walk(childSubject, normalizedSubject.id),
    );
  };

  (subjects || []).forEach((subject) => walk(subject));
  return Array.from(subjectsById.values());
}

export function normalizeExamTopic(topic) {
  if (!topic) return null;

  const subjectId = toUiId(
    topic.subjectId ?? topic.subjectID ?? topic.subject?.id,
  );

  return {
    ...topic,
    id: toUiId(topic.id),
    subjectId,
    subjectID: subjectId,
    name: topic.name || "",
    status: getStatusBoolean(topic.status, true),
    subject: topic.subject ? normalizeExamSubject(topic.subject) : topic.subject,
  };
}

export function normalizeExamTopics(topics) {
  return (topics || []).map(normalizeExamTopic).filter(Boolean);
}

export function normalizeExam(exam) {
  if (!exam) return null;

  const categoryId = toUiId(exam.categoryId ?? exam.categoryID ?? exam.category?.id);

  return {
    ...exam,
    id: toUiId(exam.id),
    name: exam.name || "",
    categoryId,
    categoryID: categoryId,
    subjectIds: toUiIdList(exam.subjectIds),
    topicIds: toUiIdList(exam.topicIds),
    durationIntMinutes:
      exam.durationIntMinutes === undefined || exam.durationIntMinutes === null
        ? ""
        : Number(exam.durationIntMinutes),
    passMark:
      exam.passMark === undefined || exam.passMark === null
        ? ""
        : Number(exam.passMark),
    publishedDate: exam.publishedDate || "",
    publishedTime: exam.publishedTime || "",
    expiredDate: exam.expiredDate || "",
    expiredTime: exam.expiredTime || "",
    questionPDF: exam.questionPDF || "",
    questionPDFName: exam.questionPDFName || "",
    demoAnswerPDF: exam.demoAnswerPDF || "",
    demoAnswerPDFName: exam.demoAnswerPDFName || "",
    status: getStatusBoolean(exam.status, true),
    category: exam.category
      ? normalizeExamCategory(exam.category)
      : exam.category,
  };
}

export function normalizeExams(exams) {
  return (exams || []).map(normalizeExam).filter(Boolean);
}

export function getExamFromResponse(response) {
  return response?.exam || response?.data?.exam || response?.data || null;
}

export function getExamsFromResponse(response) {
  return Array.isArray(response?.exams)
    ? response.exams
    : Array.isArray(response?.data?.exams)
      ? response.data.exams
      : [];
}

export function getLookupItemsFromResponse(response, key) {
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
}

export function getExamPagination(response, fallbackCount = 0) {
  const pagination = response?.pagination || response?.meta || {};
  const total =
    pagination.total ??
    pagination.totalItems ??
    pagination.count ??
    response?.total ??
    response?.totalItems ??
    response?.count ??
    fallbackCount;
  const page = pagination.page ?? pagination.currentPage ?? 1;
  const limit = pagination.limit ?? pagination.perPage ?? fallbackCount;

  return {
    total,
    page,
    limit,
    totalPages:
      pagination.totalPages ??
      (limit ? Math.ceil(total / Math.max(Number(limit) || 1, 1)) : 0),
  };
}

export function buildExamCreateBody(examInput) {
  const body = {
    name: examInput.name.trim(),
    categoryID: toApiId(examInput.categoryID ?? examInput.categoryId),
    subjectIds: toApiIdList(examInput.subjectIds),
    topicIds: toApiIdList(examInput.topicIds),
    durationIntMinutes: Number(examInput.durationIntMinutes),
    passMark: Number(examInput.passMark),
    publishedDate: examInput.publishedDate.trim(),
    publishedTime: examInput.publishedTime.trim(),
    expiredDate: examInput.expiredDate.trim(),
    expiredTime: examInput.expiredTime.trim(),
    status: Boolean(examInput.status),
  };
  const questionPDFFile = examInput.questionPDFFile;
  const demoAnswerPDFFile = examInput.demoAnswerPDFFile;
  const hasQuestionPDFFile =
    typeof File !== "undefined" && questionPDFFile instanceof File;
  const hasDemoAnswerPDFFile =
    typeof File !== "undefined" && demoAnswerPDFFile instanceof File;

  if (!hasQuestionPDFFile && !hasDemoAnswerPDFFile) {
    return body;
  }

  const formData = new FormData();

  Object.entries(body).forEach(([key, value]) => {
    formData.append(
      key,
      Array.isArray(value) ? JSON.stringify(value) : String(value),
    );
  });

  if (hasQuestionPDFFile) {
    formData.append("questionPDF", questionPDFFile, questionPDFFile.name);
  }

  if (hasDemoAnswerPDFFile) {
    formData.append("demoAnswerPDF", demoAnswerPDFFile, demoAnswerPDFFile.name);
  }

  return formData;
}

function areIdListsEqual(firstList, secondList) {
  const firstValues = toUiIdList(firstList);
  const secondValues = toUiIdList(secondList);

  if (firstValues.length !== secondValues.length) return false;

  const secondSet = new Set(secondValues);
  return firstValues.every((id) => secondSet.has(id));
}

export function buildExamUpdateBody(examInput, currentExam) {
  const body = {};
  const normalizedCurrentExam = normalizeExam(currentExam);
  const nextName = examInput.name.trim();
  const nextCategoryId = toUiId(examInput.categoryID ?? examInput.categoryId);

  if (nextName !== (normalizedCurrentExam?.name || "")) {
    body.name = nextName;
  }

  if (nextCategoryId !== (normalizedCurrentExam?.categoryId || "")) {
    body.categoryID = toApiId(nextCategoryId);
  }

  if (!areIdListsEqual(examInput.subjectIds, normalizedCurrentExam?.subjectIds)) {
    body.subjectIds = toApiIdList(examInput.subjectIds);
  }

  if (!areIdListsEqual(examInput.topicIds, normalizedCurrentExam?.topicIds)) {
    body.topicIds = toApiIdList(examInput.topicIds);
  }

  const numericFields = ["durationIntMinutes", "passMark"];
  numericFields.forEach((field) => {
    const nextValue = Number(examInput[field]);
    const currentValue = Number(normalizedCurrentExam?.[field]);

    if (nextValue !== currentValue) {
      body[field] = nextValue;
    }
  });

  const textFields = [
    "publishedDate",
    "publishedTime",
    "expiredDate",
    "expiredTime",
  ];
  textFields.forEach((field) => {
    const nextValue = String(examInput[field] || "").trim();
    const currentValue = String(normalizedCurrentExam?.[field] || "").trim();

    if (nextValue !== currentValue) {
      body[field] = nextValue;
    }
  });

  return body;
}

export function hasObjectEntries(value) {
  return value && Object.keys(value).length > 0;
}
