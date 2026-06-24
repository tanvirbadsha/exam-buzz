export function normalizeTeacher(teacher) {
  if (!teacher) return null;

  const status =
    typeof teacher.status === "boolean"
      ? teacher.status
      : teacher.status !== undefined && teacher.status !== null
        ? teacher.status === "true" || teacher.status === 1
        : Boolean(teacher.isActive);
  const name = teacher.name || teacher.fullName || "";

  return {
    ...teacher,
    name,
    fullName: name,
    phone: teacher.phone || "",
    email: teacher.email || "",
    status,
    isActive: status,
    createdAt: teacher.createdAt || "",
    updatedAt: teacher.updatedAt || "",
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
