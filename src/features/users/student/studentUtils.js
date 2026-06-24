export function normalizeStudent(student) {
  if (!student) return null;

  const status =
    typeof student.status === "boolean"
      ? student.status
      : student.status !== undefined && student.status !== null
        ? student.status === "true" || student.status === 1
        : Boolean(student.isActive);

  return {
    ...student,
    name: student.name || "",
    phone: student.phone || "",
    email: student.email || "",
    status,
    isActive: status,
    imageUrl: student.image || student.imageUrl || "",
    createdAt: student.createdAt || "",
    updatedAt: student.updatedAt || "",
  };
}

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
