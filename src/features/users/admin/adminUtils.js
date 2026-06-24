import { ALL_ADMIN_ACCESS_KEYS } from "@/lib/adminData";

export function normalizeAdmin(admin) {
  if (!admin) return null;

  const isSuperAdmin =
    Boolean(admin.isSuperAdmin) || admin.role === "super_admin";

  return {
    ...admin,
    isSuperAdmin,
    role: isSuperAdmin ? "super_admin" : "sub_admin",
    imageUrl: admin.imageUrl || "",
    accessKeys: isSuperAdmin
      ? ALL_ADMIN_ACCESS_KEYS
      : admin.accessKeys?.length
        ? admin.accessKeys
        : ["dashboard"],
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
