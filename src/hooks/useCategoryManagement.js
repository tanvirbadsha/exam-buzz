"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CATEGORY_STORAGE_KEY,
  createCategoryId,
  createCategorySlug,
} from "@/lib/categoryData";

let cachedRawCategories = null;
let cachedCategories = null;

function parseCategoryList(storedValue) {
  if (!storedValue) return null;

  try {
    const parsedCategories = JSON.parse(storedValue);
    return Array.isArray(parsedCategories) ? parsedCategories : null;
  } catch {
    return null;
  }
}

function mergeWithInitialCategories(storedCategories, initialCategories) {
  if (!storedCategories) return initialCategories;

  const storedCategoryIds = new Set(
    storedCategories.map((category) => category.id),
  );
  const missingInitialCategories = initialCategories.filter(
    (category) => !storedCategoryIds.has(category.id),
  );

  return [...missingInitialCategories, ...storedCategories];
}

function readCategorySnapshot(initialCategories) {
  if (typeof window === "undefined") return initialCategories;

  const storedValue = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!storedValue) {
    cachedRawCategories = null;
    cachedCategories = initialCategories;
    return cachedCategories;
  }

  if (storedValue === cachedRawCategories && cachedCategories) {
    return cachedCategories;
  }

  const parsedCategories = parseCategoryList(storedValue);
  cachedRawCategories = storedValue;
  cachedCategories = mergeWithInitialCategories(
    parsedCategories,
    initialCategories,
  );
  return cachedCategories;
}

function subscribeToCategoryStore(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("exam-buzz-categories-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("exam-buzz-categories-change", onStoreChange);
  };
}

function emitCategoryStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("exam-buzz-categories-change"));
}

function buildChildrenMap(categories) {
  const childrenMap = new Map();

  categories.forEach((category) => {
    const parentKey = category.parentId || "root";
    const children = childrenMap.get(parentKey) || [];
    children.push(category);
    childrenMap.set(parentKey, children);
  });

  return childrenMap;
}

function getDescendantIds(categories, categoryId) {
  const childrenMap = buildChildrenMap(categories);
  const descendantIds = new Set();
  const stack = [...(childrenMap.get(categoryId) || [])];

  while (stack.length > 0) {
    const category = stack.pop();
    if (!category || descendantIds.has(category.id)) continue;

    descendantIds.add(category.id);
    stack.push(...(childrenMap.get(category.id) || []));
  }

  return descendantIds;
}

function getCategoryPath(categoriesById, categoryId) {
  const path = [];
  const visitedIds = new Set();
  let currentCategory = categoriesById.get(categoryId);

  while (currentCategory && !visitedIds.has(currentCategory.id)) {
    path.unshift(currentCategory);
    visitedIds.add(currentCategory.id);
    currentCategory = currentCategory.parentId
      ? categoriesById.get(currentCategory.parentId)
      : null;
  }

  return path;
}

function normalizeCategory(categoryInput, currentCategory = {}) {
  const name = categoryInput.name.trim();
  const slug = categoryInput.slug?.trim() || createCategorySlug(name);

  return {
    ...currentCategory,
    id: currentCategory.id || createCategoryId(),
    name,
    slug,
    description: categoryInput.description?.trim() || "",
    parentId: categoryInput.parentId || null,
    status: categoryInput.status || "active",
    examCount: Math.max(0, Number(categoryInput.examCount) || 0),
    createdAt: currentCategory.createdAt || new Date().toISOString(),
    updatedAt: currentCategory.id ? new Date().toISOString() : undefined,
  };
}

function logCreatedCategory(category, categories) {
  const categoriesById = new Map(
    categories.map((currentCategory) => [currentCategory.id, currentCategory]),
  );
  const parent = category.parentId ? categoriesById.get(category.parentId) : null;
  const path = getCategoryPath(categoriesById, category.id).map(
    (pathCategory) => pathCategory.name,
  );

  console.log("Created exam category", {
    category,
    parent: parent
      ? { id: parent.id, name: parent.name, parentId: parent.parentId }
      : null,
    path,
    parentSubCategoryCount: parent
      ? categories.filter(
          (currentCategory) => currentCategory.parentId === parent.id,
        ).length
      : categories.filter((currentCategory) => !currentCategory.parentId)
          .length,
  });
}

export function useCategoryManagement(initialCategories) {
  const getSnapshot = useCallback(
    () => readCategorySnapshot(initialCategories),
    [initialCategories],
  );

  const categories = useSyncExternalStore(
    subscribeToCategoryStore,
    getSnapshot,
    () => initialCategories,
  );

  const persistCategories = useCallback((nextCategories) => {
    cachedRawCategories = JSON.stringify(nextCategories);
    cachedCategories = nextCategories;
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, cachedRawCategories);
    emitCategoryStoreChange();
  }, []);

  const createCategory = useCallback(
    (categoryInput) => {
      const nextCategory = normalizeCategory(categoryInput);
      const nextCategories = [nextCategory, ...categories];
      persistCategories(nextCategories);
      logCreatedCategory(nextCategory, nextCategories);
      return nextCategory;
    },
    [categories, persistCategories],
  );

  const updateCategory = useCallback(
    (categoryId, categoryInput) => {
      const targetCategory = categories.find(
        (category) => category.id === categoryId,
      );
      if (!targetCategory) return null;

      const descendantIds = getDescendantIds(categories, categoryId);
      const requestedParentId = categoryInput.parentId || null;
      const parentId =
        requestedParentId === categoryId || descendantIds.has(requestedParentId)
          ? targetCategory.parentId
          : requestedParentId;

      let updatedCategory = null;
      const nextCategories = categories.map((category) => {
        if (category.id !== categoryId) return category;

        updatedCategory = normalizeCategory(
          { ...categoryInput, parentId },
          category,
        );
        return updatedCategory;
      });

      persistCategories(nextCategories);
      return updatedCategory;
    },
    [categories, persistCategories],
  );

  const deleteCategory = useCallback(
    (categoryId) => {
      const targetCategory = categories.find(
        (category) => category.id === categoryId,
      );
      if (!targetCategory) return null;

      const categoryIdsToDelete = getDescendantIds(categories, categoryId);
      categoryIdsToDelete.add(categoryId);
      persistCategories(
        categories.filter((category) => !categoryIdsToDelete.has(category.id)),
      );

      return {
        category: targetCategory,
        deletedCount: categoryIdsToDelete.size,
      };
    },
    [categories, persistCategories],
  );

  const updateCategoryStatus = useCallback(
    (categoryId, status) => {
      let updatedCategory = null;
      const nextCategories = categories.map((category) => {
        if (category.id !== categoryId) return category;

        updatedCategory = {
          ...category,
          status,
          updatedAt: new Date().toISOString(),
        };
        return updatedCategory;
      });

      persistCategories(nextCategories);
      return updatedCategory;
    },
    [categories, persistCategories],
  );

  const categoryIndex = useMemo(() => {
    const categoriesById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const childrenMap = buildChildrenMap(categories);
    const directChildCounts = new Map();
    const descendantCounts = new Map();

    categories.forEach((category) => {
      directChildCounts.set(category.id, childrenMap.get(category.id)?.length || 0);
      descendantCounts.set(category.id, getDescendantIds(categories, category.id).size);
    });

    return {
      categoriesById,
      childrenMap,
      directChildCounts,
      descendantCounts,
    };
  }, [categories]);

  const totals = useMemo(
    () =>
      categories.reduce(
        (summary, category) => ({
          total: summary.total + 1,
          root: summary.root + (category.parentId ? 0 : 1),
          active: summary.active + (category.status === "active" ? 1 : 0),
          exams: summary.exams + (Number(category.examCount) || 0),
        }),
        { total: 0, root: 0, active: 0, exams: 0 },
      ),
    [categories],
  );

  return {
    categories,
    categoryIndex,
    createCategory,
    deleteCategory,
    totals,
    updateCategory,
    updateCategoryStatus,
  };
}
