"use client";

import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableResponsive,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { CATEGORY_STATUS_OPTIONS } from "@/lib/categoryData";
import {
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  FolderTree,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ROOT_PARENT_VALUE } from "./CategoryForm";
import { CategoryModal } from "./CategoryModal";

function CategoryActionMenu({ category, onDelete, onEdit }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${category.name}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(category);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Pencil size={15} className="text-muted" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(category);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </FloatingActionMenu>
  );
}

function sortCategories(categories) {
  return [...categories].sort((firstCategory, secondCategory) =>
    firstCategory.name.localeCompare(secondCategory.name),
  );
}

function buildParentOptions(childrenMap, excludedIds = new Set()) {
  const options = [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortCategories(childrenMap.get(parentId) || []);

    children.forEach((category) => {
      if (excludedIds.has(category.id)) return;

      const path = [...parentPath, category.name];
      options.push({
        label: category.name,
        value: category.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(category.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

function getCategoryPath(categoriesById, categoryId) {
  const path = [];
  const visitedIds = new Set();
  let category = categoriesById.get(categoryId);

  while (category && !visitedIds.has(category.id)) {
    path.unshift(category);
    visitedIds.add(category.id);
    category = category.parentId ? categoriesById.get(category.parentId) : null;
  }

  return path;
}

export function CategoryManager({ initialCategories }) {
  const {
    categories,
    categoryIndex,
    createCategory,
    deleteCategory,
    totals,
    updateCategory,
    updateCategoryStatus,
  } = useCategoryManagement(initialCategories);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    category: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const selectedCategory =
    selectedParentId && categoryIndex.categoriesById.has(selectedParentId)
      ? categoryIndex.categoriesById.get(selectedParentId)
      : null;
  const currentParentKey = selectedCategory?.id || "root";
  const currentCategories = useMemo(
    () => sortCategories(categoryIndex.childrenMap.get(currentParentKey) || []),
    [categoryIndex.childrenMap, currentParentKey],
  );
  const breadcrumbCategories = useMemo(
    () =>
      selectedCategory
        ? getCategoryPath(categoryIndex.categoriesById, selectedCategory.id)
        : [],
    [categoryIndex.categoriesById, selectedCategory],
  );

  const filteredCategories = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return currentCategories.filter((category) => {
      const matchesSearch =
        !query ||
        [category.name, category.slug, category.description]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [currentCategories, deferredSearchQuery, statusFilter]);

  const parentOptions = useMemo(() => {
    const excludedIds = new Set();

    if (modalState.mode === "edit" && modalState.category) {
      excludedIds.add(modalState.category.id);
      categoryIndex.descendantCounts.forEach((_, categoryId) => {
        const path = getCategoryPath(categoryIndex.categoriesById, categoryId);
        const isDescendant = path.some(
          (pathCategory) => pathCategory.id === modalState.category.id,
        );

        if (isDescendant && categoryId !== modalState.category.id) {
          excludedIds.add(categoryId);
        }
      });
    }

    return buildParentOptions(categoryIndex.childrenMap, excludedIds);
  }, [
    categoryIndex.categoriesById,
    categoryIndex.childrenMap,
    categoryIndex.descendantCounts,
    modalState.category,
    modalState.mode,
  ]);

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", category: null });
  };

  const openEditModal = (category) => {
    setModalState({ isOpen: true, mode: "edit", category });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const drillIntoCategory = (category) => {
    setSelectedParentId(category.id);
    resetFilters();
  };

  const handleSubmit = (categoryInput) => {
    if (modalState.mode === "edit" && modalState.category) {
      const updatedCategory = updateCategory(
        modalState.category.id,
        categoryInput,
      );
      if (updatedCategory) {
        toast.success(`${updatedCategory.name} updated.`);
      }
      return;
    }

    const createdCategory = createCategory(categoryInput);
    toast.success(`${createdCategory.name} created.`);
  };

  const handleDelete = (category) => {
    const childCount = categoryIndex.directChildCounts.get(category.id) || 0;
    const descendantCount =
      categoryIndex.descendantCounts.get(category.id) || 0;
    const confirmed = window.confirm(
      descendantCount > 0
        ? `Delete ${category.name} and ${descendantCount} nested categor${descendantCount === 1 ? "y" : "ies"}?`
        : `Delete ${category.name}?`,
    );
    if (!confirmed) return;

    const result = deleteCategory(category.id);
    if (!result) {
      toast.error("Category could not be deleted.");
      return;
    }

    toast.success(
      result.deletedCount > 1
        ? `${result.deletedCount} categories deleted.`
        : `${category.name} deleted.`,
    );

    if (childCount > 0) {
      resetFilters();
    }
  };

  const handleStatusChange = (category, checked) => {
    const status = checked ? "active" : "inactive";
    const updatedCategory = updateCategoryStatus(category.id, status);
    if (updatedCategory) {
      toast.success(`${updatedCategory.name} marked ${status}.`);
    }
  };

  const showParentColumn = Boolean(selectedCategory);
  const tableTitle = selectedCategory ? selectedCategory.name : "Categories";
  const tableSummary = `${filteredCategories.length} of ${currentCategories.length} ${
    selectedCategory ? "direct sub-categories" : "main categories"
  } shown`;
  const emptyTableColSpan = showParentColumn ? 6 : 5;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam categories
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Category hierarchy
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Create parent categories, nest sub-categories at any depth, and
            drill into each level from the sub-category count.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Total</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">
              Main Categories
            </p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.root}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.active}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_14rem_auto_auto] lg:items-end">
          <label className="field-group">
            <span className="field-label">Search current level</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search name or slug..."
                aria-label="Search categories"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={CATEGORY_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(option) => setStatusFilter(option.value)}
            placeholder="All statuses"
          />

          <button
            type="button"
            className="button button-secondary min-h-11"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            className="button button-primary min-h-11"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Create category
          </button>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            {selectedCategory ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-brand-strong transition-colors hover:bg-brand-soft"
                  onClick={() => {
                    setSelectedParentId(null);
                    resetFilters();
                  }}
                >
                  Categories
                </button>
                {breadcrumbCategories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex min-w-0 items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-border-strong" />
                    <button
                      type="button"
                      className={`max-w-44 truncate rounded-md px-2 py-1 transition-colors ${
                        category.id === selectedCategory?.id
                          ? "bg-brand-soft text-brand-strong"
                          : "text-brand-strong hover:bg-brand-soft"
                      }`}
                      onClick={() => {
                        setSelectedParentId(category.id);
                        resetFilters();
                      }}
                    >
                      {category.name}
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <h2 className="text-base font-semibold text-foreground">
                {tableTitle}
              </h2>
            )}
            {selectedCategory && (
              <h2 className="sr-only">{tableTitle}</h2>
            )}
            <p className="text-sm text-muted">{tableSummary}</p>
          </div>

          {selectedCategory && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setSelectedParentId(selectedCategory.parentId || null);
                resetFilters();
              }}
            >
              <ArrowLeft size={16} />
              Back one level
            </button>
          )}
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Category</TableTh>
                {showParentColumn && <TableTh>Parent</TableTh>}
                <TableTh>Sub categories</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => {
                  const directChildCount =
                    categoryIndex.directChildCounts.get(category.id) || 0;
                  const parent =
                    showParentColumn && category.parentId
                      ? categoryIndex.categoriesById.get(category.parentId)
                      : null;

                  return (
                    <TableRow key={category.id}>
                      <TableTd className="font-mono text-xs text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-72 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                            {directChildCount > 0 ? (
                              <FolderOpen size={17} />
                            ) : (
                              <FolderTree size={17} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {category.name}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted">
                              /{category.slug || "category"}
                            </p>
                          </div>
                        </div>
                      </TableTd>
                      {showParentColumn && (
                        <TableTd className="text-sm text-muted">
                          {parent ? parent.name : "Top-level"}
                        </TableTd>
                      )}
                      <TableTd>
                        {directChildCount > 0 ? (
                          <button
                            type="button"
                            className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-brand-soft bg-brand-soft px-3 text-sm font-black text-brand-strong transition-colors hover:border-brand hover:bg-white"
                            onClick={() => drillIntoCategory(category)}
                            aria-label={`Show ${directChildCount} sub-categories of ${category.name}`}
                          >
                            {directChildCount}
                          </button>
                        ) : (
                          <span className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-sm font-bold text-muted">
                            0
                          </span>
                        )}
                      </TableTd>
                      <TableTd>
                        <StatusToggle
                          checked={category.status === "active"}
                          label={`Set ${category.name} active status`}
                          onChange={(checked) =>
                            handleStatusChange(category, checked)
                          }
                        />
                      </TableTd>
                      <TableTd>
                        <CategoryActionMenu
                          category={category}
                          onDelete={handleDelete}
                          onEdit={openEditModal}
                        />
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd
                    colSpan={emptyTableColSpan}
                    className="py-12 text-center"
                  >
                    <p className="font-semibold text-foreground">
                      No categories found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a category at this level.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <CategoryModal
        category={modalState.category}
        defaultParentId={selectedCategory?.id || ROOT_PARENT_VALUE}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        parentOptions={parentOptions}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
