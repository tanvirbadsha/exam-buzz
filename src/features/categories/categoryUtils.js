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

export function normalizeCategory(category) {
  if (!category) return null;

  const parentId = category.parentId ?? category.parentID ?? null;
  const status =
    typeof category.status === "boolean"
      ? category.status
      : category.status !== undefined && category.status !== null
        ? category.status === "true" ||
          category.status === "active" ||
          category.status === 1
        : false;

  return {
    ...category,
    id: category.id,
    parentId,
    parentID: parentId,
    name: category.name || "",
    icon: category.icon || "",
    status,
    isActive: status,
    createdAt: category.createdAt || "",
    updatedAt: category.updatedAt || "",
    parent: category.parent ? normalizeCategory(category.parent) : null,
  };
}

export function extractCategoryFromResponse(response) {
  return (
    response?.category ||
    response?.data?.category ||
    response?.data ||
    null
  );
}

export function buildCategoryCreateFormData(categoryInput) {
  const formData = new FormData();

  formData.append("name", categoryInput.name.trim());
  formData.append("status", String(categoryInput.status === "active"));
  appendIfPresent(formData, "parentID", categoryInput.parentID);
  appendIfPresent(formData, "icon", categoryInput.icon);

  return formData;
}

export function buildCategoryUpdateFormData(categoryInput, currentCategory) {
  const formData = new FormData();
  const currentParentId = currentCategory?.parentId ?? null;
  const nextParentId = categoryInput.parentID ?? null;

  if (categoryInput.name.trim() !== currentCategory?.name) {
    formData.append("name", categoryInput.name.trim());
  }

  if (String(nextParentId || "") !== String(currentParentId || "")) {
    formData.append("parentID", nextParentId || "");
  }

  appendIfPresent(formData, "icon", categoryInput.icon);

  return formData;
}

export function hasFormDataEntries(formData) {
  return Array.from(formData.keys()).length > 0;
}
