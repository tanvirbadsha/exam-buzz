"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  PACKAGE_INFO_STORAGE_KEY,
  createPackageId,
  htmlToPackageRuleLines,
  packageRulesToHtml,
} from "@/lib/packageInfoData";

let cachedRawPackages = null;
let cachedPackages = null;

function parsePackageList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedPackages = JSON.parse(storedValue);
    return Array.isArray(parsedPackages) ? parsedPackages : null;
  } catch {
    return null;
  }
}

function mergeWithInitialPackages(storedPackages, initialPackages) {
  if (!storedPackages) return initialPackages;

  const storedPackageIds = new Set(
    storedPackages.map((packageInfo) => packageInfo.id),
  );
  const missingInitialPackages = initialPackages.filter(
    (packageInfo) => !storedPackageIds.has(packageInfo.id),
  );

  return [...missingInitialPackages, ...storedPackages];
}

function readPackageSnapshot(initialPackages) {
  if (typeof window === "undefined") return initialPackages;

  const storedValue = window.localStorage.getItem(PACKAGE_INFO_STORAGE_KEY);
  if (!storedValue) {
    cachedRawPackages = null;
    cachedPackages = initialPackages;
    return cachedPackages;
  }

  if (storedValue === cachedRawPackages && cachedPackages) {
    return cachedPackages;
  }

  const parsedPackages = parsePackageList(storedValue);
  cachedRawPackages = storedValue;
  cachedPackages = mergeWithInitialPackages(parsedPackages, initialPackages);
  return cachedPackages;
}

function subscribeToPackageStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-package-info-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-package-info-change", onStoreChange);
  };
}

function emitPackageStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-package-info-change"));
}

function parsePositiveNumber(value) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) return 0;
  return parsedValue;
}

function normalizeLines(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizePermissions(value) {
  if (Array.isArray(value)) return value;

  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [pathText, permissionText] = line.split(":");
      const pathSource = String(pathText || line).trim();
      const pathParts = pathSource.includes(">")
        ? pathSource.split(">")
        : pathSource.split(/\s{2,}/);

      return {
        path: pathParts
          .map((part) => part.trim())
          .filter(Boolean),
        permission: String(permissionText || "Permitted").trim(),
      };
    });
}

function normalizePackage(packageInput, currentPackage = {}) {
  const rulesHtml = packageInput.rulesHtml || packageRulesToHtml(packageInput.rules);

  return {
    ...currentPackage,
    id: currentPackage.id || createPackageId(),
    title: packageInput.title.trim(),
    price: parsePositiveNumber(packageInput.price),
    currency: packageInput.currency?.trim() || "BDT",
    validityDays: Math.floor(parsePositiveNumber(packageInput.validityDays)),
    status: packageInput.status || "draft",
    packageType: packageInput.packageType || "Course Base",
    packageTypeNote: packageInput.packageTypeNote?.trim() || "",
    totalPurchased: Math.floor(parsePositiveNumber(packageInput.totalPurchased)),
    totalSellAmount: parsePositiveNumber(packageInput.totalSellAmount),
    url: packageInput.url?.trim() || "",
    imageUrl: packageInput.imageUrl?.trim() || "",
    summary: packageInput.summary?.trim() || "",
    rules: htmlToPackageRuleLines(rulesHtml),
    rulesHtml,
    permissions: normalizePermissions(packageInput.permissions),
  };
}

export function usePackageInfoManagement(initialPackages) {
  const getSnapshot = useCallback(
    () => readPackageSnapshot(initialPackages),
    [initialPackages],
  );

  const packages = useSyncExternalStore(
    subscribeToPackageStore,
    getSnapshot,
    () => initialPackages,
  );

  const persistPackages = useCallback((nextPackages) => {
    cachedRawPackages = JSON.stringify(nextPackages);
    cachedPackages = nextPackages;
    window.localStorage.setItem(
      PACKAGE_INFO_STORAGE_KEY,
      cachedRawPackages,
    );
    emitPackageStoreChange();
  }, []);

  const createPackage = useCallback(
    (packageInput) => {
      const nextPackage = normalizePackage(packageInput);
      persistPackages([nextPackage, ...packages]);
      return nextPackage;
    },
    [packages, persistPackages],
  );

  const updatePackage = useCallback(
    (packageId, packageInput) => {
      let updatedPackage = null;
      const nextPackages = packages.map((packageInfo) => {
        if (packageInfo.id !== packageId) return packageInfo;

        updatedPackage = normalizePackage(packageInput, packageInfo);
        return updatedPackage;
      });

      persistPackages(nextPackages);
      return updatedPackage;
    },
    [packages, persistPackages],
  );

  const deletePackage = useCallback(
    (packageId) => {
      const targetPackage = packages.find(
        (packageInfo) => packageInfo.id === packageId,
      );
      if (!targetPackage) return false;

      persistPackages(
        packages.filter((packageInfo) => packageInfo.id !== packageId),
      );
      return true;
    },
    [packages, persistPackages],
  );

  const updatePackageStatus = useCallback(
    (packageId, status) => {
      let updatedPackage = null;
      const nextPackages = packages.map((packageInfo) => {
        if (packageInfo.id !== packageId) return packageInfo;

        updatedPackage = { ...packageInfo, status };
        return updatedPackage;
      });

      persistPackages(nextPackages);
      return updatedPackage;
    },
    [packages, persistPackages],
  );

  const totals = useMemo(
    () =>
      packages.reduce(
        (summary, packageInfo) => ({
          active: summary.active + (packageInfo.status === "active" ? 1 : 0),
          students: summary.students + Number(packageInfo.totalPurchased || 0),
          revenue: summary.revenue + Number(packageInfo.totalSellAmount || 0),
        }),
        { active: 0, students: 0, revenue: 0 },
      ),
    [packages],
  );

  return {
    createPackage,
    deletePackage,
    packages,
    totals,
    updatePackage,
    updatePackageStatus,
  };
}
