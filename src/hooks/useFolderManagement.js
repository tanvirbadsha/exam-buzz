"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createFolderId, getDescendantFolderIds, FOLDER_STORAGE_KEY } from "@/lib/folderData";

let cachedRawFolders = null;
let cachedFolders = null;

function parseFolderList(storedValue) {
  if (!storedValue) return null;
  try {
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mergeWithInitialFolders(stored, initial) {
  if (!stored) return initial;
  const storedIds = new Set(stored.map((f) => f.id));
  const missing = initial.filter((f) => !storedIds.has(f.id));
  return [...missing, ...stored];
}

function readFolderSnapshot(initialFolders) {
  if (typeof window === "undefined") return initialFolders;
  const storedValue = window.localStorage.getItem(FOLDER_STORAGE_KEY);
  if (!storedValue) {
    cachedRawFolders = null;
    cachedFolders = initialFolders;
    return cachedFolders;
  }
  if (storedValue === cachedRawFolders && cachedFolders) {
    return cachedFolders;
  }
  const parsed = parseFolderList(storedValue);
  cachedRawFolders = storedValue;
  cachedFolders = mergeWithInitialFolders(parsed, initialFolders);
  return cachedFolders;
}

function subscribeToFolderStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-folders-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-folders-change", onStoreChange);
  };
}

function emitFolderStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-folders-change"));
}

function normalizeFolder(folderInput, currentFolder = {}) {
  const now = new Date().toISOString();
  return {
    ...currentFolder,
    id: currentFolder.id || createFolderId(),
    name: folderInput.name.trim(),
    parentId: folderInput.parentId || null,
    isActive: folderInput.isActive !== undefined ? folderInput.isActive : true,
    createdAt: currentFolder.createdAt || now,
    updatedAt: currentFolder.id ? now : undefined,
  };
}

export function useFolderManagement(initialFolders) {
  const getSnapshot = useCallback(
    () => readFolderSnapshot(initialFolders),
    [initialFolders],
  );

  const folders = useSyncExternalStore(
    subscribeToFolderStore,
    getSnapshot,
    () => initialFolders,
  );

  const persistFolders = useCallback((nextFolders) => {
    cachedRawFolders = JSON.stringify(nextFolders);
    cachedFolders = nextFolders;
    window.localStorage.setItem(FOLDER_STORAGE_KEY, cachedRawFolders);
    emitFolderStoreChange();
  }, []);

  const createFolder = useCallback(
    (folderInput) => {
      const nextFolder = normalizeFolder(folderInput);
      persistFolders([nextFolder, ...folders]);
      return nextFolder;
    },
    [folders, persistFolders],
  );

  const updateFolder = useCallback(
    (folderId, folderInput) => {
      let updated = null;
      const nextFolders = folders.map((folder) => {
        if (folder.id !== folderId) return folder;
        updated = normalizeFolder(folderInput, folder);
        return updated;
      });
      persistFolders(nextFolders);
      return updated;
    },
    [folders, persistFolders],
  );

  const deleteFolder = useCallback(
    (folderId) => {
      const target = folders.find((f) => f.id === folderId);
      if (!target) return false;
      const desc = getDescendantFolderIds(folders, folderId);
      const idsToDelete = new Set([folderId, ...desc]);
      persistFolders(folders.filter((f) => !idsToDelete.has(f.id)));
      return true;
    },
    [folders, persistFolders],
  );

  const toggleActive = useCallback(
    (folderId) => {
      let updated = null;
      const nextFolders = folders.map((folder) => {
        if (folder.id !== folderId) return folder;
        updated = { ...folder, isActive: !folder.isActive, updatedAt: new Date().toISOString() };
        return updated;
      });
      persistFolders(nextFolders);
      return updated;
    },
    [folders, persistFolders],
  );

  const themeTotals = useMemo(
    () =>
      folders.reduce(
        (summary, folder) => ({
          total: summary.total + (folder.isActive ? 1 : 0),
          inactive: summary.inactive + (folder.isActive ? 0 : 1),
        }),
        { total: 0, inactive: 0 },
      ),
    [folders],
  );

  return {
    createFolder,
    deleteFolder,
    folders,
    themeTotals,
    toggleActive,
    updateFolder,
  };
}
