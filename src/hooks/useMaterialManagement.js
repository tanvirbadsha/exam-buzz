"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MATERIAL_STORAGE_KEY, createMaterialId } from "@/lib/materialData";

let cachedRawMaterials = null;
let cachedMaterials = null;

function parseMaterialList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedMaterials = JSON.parse(storedValue);
    return Array.isArray(parsedMaterials) ? parsedMaterials : null;
  } catch {
    return null;
  }
}

function mergeWithInitialMaterials(storedMaterials, initialMaterials) {
  if (!storedMaterials) return initialMaterials;

  const storedMaterialIds = new Set(
    storedMaterials.map((material) => material.id),
  );
  const missingInitialMaterials = initialMaterials.filter(
    (material) => !storedMaterialIds.has(material.id),
  );

  return [...missingInitialMaterials, ...storedMaterials];
}

function readMaterialSnapshot(initialMaterials) {
  if (typeof window === "undefined") return initialMaterials;

  const storedValue = window.localStorage.getItem(MATERIAL_STORAGE_KEY);
  if (!storedValue) {
    cachedRawMaterials = null;
    cachedMaterials = initialMaterials;
    return cachedMaterials;
  }

  if (storedValue === cachedRawMaterials && cachedMaterials) {
    return cachedMaterials;
  }

  const parsedMaterials = parseMaterialList(storedValue);
  cachedRawMaterials = storedValue;
  cachedMaterials = mergeWithInitialMaterials(parsedMaterials, initialMaterials);
  return cachedMaterials;
}

function subscribeToMaterialStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-materials-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-materials-change", onStoreChange);
  };
}

function emitMaterialStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-materials-change"));
}

function normalizeMaterial(materialInput, currentMaterial = {}) {
  return {
    ...currentMaterial,
    id: currentMaterial.id || createMaterialId(),
    title: materialInput.title.trim(),
    categoryId: materialInput.categoryId,
    examId: materialInput.examId,
    materialFolderId: materialInput.materialFolderId,
    fileName: materialInput.fileName,
    fileType: materialInput.fileType,
    fileSize: Number(materialInput.fileSize) || 0,
    fileDataUrl: materialInput.fileDataUrl || "",
    createdAt: currentMaterial.createdAt || new Date().toISOString(),
    updatedAt: currentMaterial.id ? new Date().toISOString() : undefined,
  };
}

export function useMaterialManagement(initialMaterials) {
  const getSnapshot = useCallback(
    () => readMaterialSnapshot(initialMaterials),
    [initialMaterials],
  );

  const materials = useSyncExternalStore(
    subscribeToMaterialStore,
    getSnapshot,
    () => initialMaterials,
  );

  const persistMaterials = useCallback((nextMaterials) => {
    cachedRawMaterials = JSON.stringify(nextMaterials);
    cachedMaterials = nextMaterials;
    window.localStorage.setItem(MATERIAL_STORAGE_KEY, cachedRawMaterials);
    emitMaterialStoreChange();
  }, []);

  const createMaterial = useCallback(
    (materialInput) => {
      const nextMaterial = normalizeMaterial(materialInput);
      persistMaterials([nextMaterial, ...materials]);
      return nextMaterial;
    },
    [materials, persistMaterials],
  );

  const updateMaterial = useCallback(
    (materialId, materialInput) => {
      let updatedMaterial = null;
      const nextMaterials = materials.map((material) => {
        if (material.id !== materialId) return material;

        updatedMaterial = normalizeMaterial(materialInput, material);
        return updatedMaterial;
      });

      persistMaterials(nextMaterials);
      return updatedMaterial;
    },
    [materials, persistMaterials],
  );

  const deleteMaterial = useCallback(
    (materialId) => {
      const targetMaterial = materials.find(
        (material) => material.id === materialId,
      );
      if (!targetMaterial) return false;

      persistMaterials(
        materials.filter((material) => material.id !== materialId),
      );
      return true;
    },
    [materials, persistMaterials],
  );

  const totals = useMemo(
    () =>
      materials.reduce(
        (summary, material) => ({
          total: summary.total + 1,
          pdf: summary.pdf + (material.fileType === "application/pdf" ? 1 : 0),
          image:
            summary.image + (material.fileType?.startsWith("image/") ? 1 : 0),
        }),
        { total: 0, pdf: 0, image: 0 },
      ),
    [materials],
  );

  return {
    createMaterial,
    deleteMaterial,
    materials,
    totals,
    updateMaterial,
  };
}
