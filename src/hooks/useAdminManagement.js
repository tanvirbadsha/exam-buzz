"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  ADMIN_STORAGE_KEY,
  ALL_ADMIN_ACCESS_KEYS,
  DEFAULT_ADMINS,
  createAdminId,
} from "@/lib/adminData";

let cachedRawAdmins = null;
let cachedAdmins = DEFAULT_ADMINS;

function readAdminsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_ADMINS;

  const storedValue = window.localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!storedValue) {
    cachedRawAdmins = null;
    cachedAdmins = DEFAULT_ADMINS;
    return cachedAdmins;
  }

  if (storedValue === cachedRawAdmins) {
    return cachedAdmins;
  }

  cachedRawAdmins = storedValue;

  try {
    const parsedAdmins = JSON.parse(storedValue);
    if (!Array.isArray(parsedAdmins)) {
      cachedAdmins = DEFAULT_ADMINS;
      return cachedAdmins;
    }

    const hasSuperAdmin = parsedAdmins.some(
      (admin) => admin.id === "super-admin",
    );

    cachedAdmins = hasSuperAdmin ? parsedAdmins : DEFAULT_ADMINS;
    return cachedAdmins;
  } catch {
    cachedAdmins = DEFAULT_ADMINS;
    return cachedAdmins;
  }
}

function safelyWriteAdmins(admins) {
  if (typeof window === "undefined") return;

  const nextRawAdmins = JSON.stringify(admins);
  cachedRawAdmins = nextRawAdmins;
  cachedAdmins = admins;
  window.localStorage.setItem(ADMIN_STORAGE_KEY, nextRawAdmins);
}

function emitAdminStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-admins-change"));
}

function subscribeToAdminStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-admins-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-admins-change", onStoreChange);
  };
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

function normalizeAccessKeys(accessKeys, role) {
  if (role === "super_admin") return ALL_ADMIN_ACCESS_KEYS;

  const requestedKeys = Array.isArray(accessKeys) ? accessKeys : ["dashboard"];
  const allowedKeys = new Set(ALL_ADMIN_ACCESS_KEYS);
  const uniqueKeys = [...new Set(requestedKeys)].filter((key) =>
    allowedKeys.has(key),
  );

  return uniqueKeys.length > 0 ? uniqueKeys : ["dashboard"];
}

export function useAdminManagement() {
  const admins = useSyncExternalStore(
    subscribeToAdminStore,
    readAdminsSnapshot,
    () => DEFAULT_ADMINS,
  );
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const persistAdmins = useCallback((nextAdmins) => {
    safelyWriteAdmins(nextAdmins);
    emitAdminStoreChange();
  }, []);

  const createAdmin = useCallback(
    (adminInput) => {
      const nextAdmin = {
        id: createAdminId(),
        name: adminInput.name.trim(),
        phone: adminInput.phone.trim(),
        email: adminInput.email.trim(),
        address: adminInput.address.trim(),
        imageUrl: adminInput.imageUrl || "",
        role: "sub_admin",
        accessKeys: normalizeAccessKeys(adminInput.accessKeys, "sub_admin"),
        createdAt: new Date().toISOString(),
      };

      persistAdmins([...admins, nextAdmin]);
      return nextAdmin;
    },
    [admins, persistAdmins],
  );

  const updateAdmin = useCallback(
    (adminId, adminInput) => {
      const nextAdmins = admins.map((admin) => {
        if (admin.id !== adminId) return admin;

        return {
          ...admin,
          name: adminInput.name.trim(),
          phone: adminInput.phone.trim(),
          email: adminInput.email.trim(),
          address: adminInput.address.trim(),
          imageUrl: adminInput.imageUrl || "",
          accessKeys: normalizeAccessKeys(
            adminInput.accessKeys ?? admin.accessKeys,
            admin.role,
          ),
        };
      });

      persistAdmins(nextAdmins);
      return nextAdmins.find((admin) => admin.id === adminId);
    },
    [admins, persistAdmins],
  );

  const deleteAdmin = useCallback(
    (adminId) => {
      const targetAdmin = admins.find((admin) => admin.id === adminId);
      if (!targetAdmin || targetAdmin.role === "super_admin") return false;

      persistAdmins(admins.filter((admin) => admin.id !== adminId));
      return true;
    },
    [admins, persistAdmins],
  );

  const updateAdminAccess = useCallback(
    (adminId, accessKeys) => {
      const nextAdmins = admins.map((admin) => {
        if (admin.id !== adminId) return admin;

        return {
          ...admin,
          accessKeys: normalizeAccessKeys(accessKeys, admin.role),
        };
      });

      persistAdmins(nextAdmins);
      return nextAdmins.find((admin) => admin.id === adminId);
    },
    [admins, persistAdmins],
  );

  const adminMap = useMemo(
    () => new Map(admins.map((admin) => [admin.id, admin])),
    [admins],
  );

  return {
    admins,
    createAdmin,
    deleteAdmin,
    getAdminById: (adminId) => adminMap.get(adminId),
    isLoaded,
    updateAdmin,
    updateAdminAccess,
  };
}
