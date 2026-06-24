export function getExamTypeApiErrorMessage(
  error,
  fallback = "Please try again.",
) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.data?.message) return error.data.message;
  if (error.error) return error.error;
  if (error.message) return error.message;
  return fallback;
}

export function normalizeExamType(examType) {
  if (!examType) return null;

  return {
    ...examType,
    name: examType.name || "",
    icon: examType.icon || null,
    createdAt: examType.createdAt || "",
    updatedAt: examType.updatedAt || "",
  };
}

function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function appendIcon(formData, icon) {
  if (isFile(icon)) {
    formData.append("icon", icon);
    return;
  }

  if (typeof icon === "string") {
    formData.append("icon", icon);
  }
}

export function buildExamTypeCreateFormData(examTypeInput) {
  const formData = new FormData();

  formData.append("name", examTypeInput.name);

  if (examTypeInput.icon) {
    appendIcon(formData, examTypeInput.icon);
  }

  return formData;
}

export function buildExamTypeUpdateFormData(examTypeInput, currentExamType) {
  const formData = new FormData();
  const nextName = examTypeInput.name.trim();
  const currentName = currentExamType?.name || "";
  const currentIcon = currentExamType?.icon || "";
  const nextIcon = examTypeInput.icon || "";

  if (nextName !== currentName) {
    formData.append("name", nextName);
  }

  if (isFile(nextIcon) || nextIcon !== currentIcon) {
    appendIcon(formData, nextIcon);
  }

  return formData;
}

export function hasFormDataEntries(formData) {
  return Array.from(formData.keys()).length > 0;
}
