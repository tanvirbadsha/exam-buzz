"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { StatusToggle } from "@/components/ui/StatusToggle";
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
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import {
  categoryApi,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useUpdateCategoryStatusMutation,
} from "@/features/categories/api/categoryApi";
import {
  useGetAllExamTypesQuery,
} from "@/features/exams/exam-types/api/examTypes";
import {
  buildCategoryCreateFormData,
  buildCategoryUpdateFormData,
  extractCategoryFromResponse,
  getApiErrorMessage,
  hasFormDataEntries,
  normalizeCategory,
} from "@/features/categories/categoryUtils";
import { CATEGORY_STATUS_OPTIONS } from "@/lib/categoryData";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  FolderOpen,
  FolderTree,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { ROOT_PARENT_VALUE } from "./CategoryForm";
import { CategoryModal } from "./CategoryModal";

const CATEGORY_PAGE_LIMIT = 10;
const INITIAL_QUERY_ARGS = {
  search: "",
  status: "all",
  page: 1,
  limit: CATEGORY_PAGE_LIMIT,
};

function CategoryActionMenu({ category, onDelete, onEdit, onView }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${category.name}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onView(category);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Eye size={15} className="text-muted" />
            View
          </button>
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

function getDescendantIds(childrenMap, categoryId) {
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

function buildCategoryIndex(categories) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const childrenMap = buildChildrenMap(categories);
  const directChildCounts = new Map();
  const descendantCounts = new Map();

  categories.forEach((category) => {
    directChildCounts.set(category.id, childrenMap.get(category.id)?.length || 0);
    descendantCounts.set(category.id, getDescendantIds(childrenMap, category.id).size);
  });

  return {
    categoriesById,
    childrenMap,
    directChildCounts,
    descendantCounts,
  };
}

function buildParentOptions(childrenMap, excludedIds = new Set()) {
  const options = [
    {
      label: "No parent",
      value: ROOT_PARENT_VALUE,
      depth: 0,
      meta: "Top-level category",
      searchText: "top level no parent",
    },
  ];

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

function matchesStatusFilter(category, statusFilter) {
  if (statusFilter === "all") return true;
  return statusFilter === "active" ? category.status : !category.status;
}

export function CategoryManager({ initialData }) {
  const dispatch = useDispatch();
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    category: null,
  });
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set());
  const [selectedExamTypes, setSelectedExamTypes] = useState([]);
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () => !initialData || Boolean(initialData._error),
  );
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  useEffect(() => {
    if (!initialData || initialData._error) {
      return;
    }

    dispatch(
      categoryApi.util.upsertQueryData(
        "getAllCategories",
        INITIAL_QUERY_ARGS,
        initialData,
      ),
    );
    queueMicrotask(() => setHasHydratedInitialData(true));
  }, [dispatch, initialData]);

  const queryArgs = useMemo(
    () => ({
      search: deferredSearchQuery,
      status: statusFilter,
      page,
      limit: CATEGORY_PAGE_LIMIT,
    }),
    [deferredSearchQuery, page, statusFilter],
  );

  const shouldUseInitialData =
    !hasHydratedInitialData &&
    page === 1 &&
    deferredSearchQuery === "" &&
    statusFilter === "all" &&
    Boolean(initialData) &&
    !initialData?._error;

  const {
    data: queryData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllCategoriesQuery(queryArgs, {
    skip: shouldUseInitialData,
    placeholderData: shouldUseInitialData ? initialData : undefined,
  });
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [updateCategoryStatus] = useUpdateCategoryStatusMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const data = shouldUseInitialData ? initialData : queryData;
  const categories = useMemo(
    () => (data?.categories || []).map(normalizeCategory).filter(Boolean),
    [data],
  );
  const pagination = data?.pagination || {
    total: 0,
    page,
    limit: CATEGORY_PAGE_LIMIT,
    totalPages: 0,
  };
  const categoryIndex = useMemo(() => buildCategoryIndex(categories), [categories]);
  const selectedCategory =
    selectedParentId && categoryIndex.categoriesById.has(selectedParentId)
      ? categoryIndex.categoriesById.get(selectedParentId)
      : null;
  const viewCategoryId =
    modalState.mode === "view" ? modalState.category?.id : undefined;
  const {
    data: detailData,
    error: detailError,
    isFetching: isFetchingDetail,
    refetch: refetchDetail,
  } = useGetCategoryByIdQuery(viewCategoryId, {
    skip: !viewCategoryId,
  });
  const detailCategory = useMemo(
    () =>
      normalizeCategory(extractCategoryFromResponse(detailData)) ||
      modalState.category,
    [detailData, modalState.category],
  );

  const { data: examTypesData } = useGetAllExamTypesQuery();
  const examTypeOptions = useMemo(() => {
    const examTypes = examTypesData?.examTypes || [];
    return examTypes.map((examType) => ({
      label: examType.name,
      value: examType.id,
      searchText: examType.name,
    }));
  }, [examTypesData]);

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
    const query = deferredSearchQuery.toLowerCase();

    return currentCategories.filter((category) => {
      const matchesSearch =
        !query || category.name.toLowerCase().includes(query);

      return matchesSearch && matchesStatusFilter(category, statusFilter);
    });
  }, [currentCategories, deferredSearchQuery, statusFilter]);

  const parentOptions = useMemo(() => {
    const excludedIds = new Set();

    if (modalState.mode === "edit" && modalState.category) {
      excludedIds.add(modalState.category.id);
      getDescendantIds(
        categoryIndex.childrenMap,
        modalState.category.id,
      ).forEach((categoryId) => excludedIds.add(categoryId));
    }

    return buildParentOptions(categoryIndex.childrenMap, excludedIds);
  }, [categoryIndex.childrenMap, modalState.category, modalState.mode]);

  const totals = useMemo(
    () => ({
      total: pagination.total || categories.length,
      root: categories.filter((category) => !category.parentId).length,
      active: categories.filter((category) => category.status).length,
    }),
    [categories, pagination.total],
  );

  const pageStart =
    pagination.total > 0 ? (page - 1) * CATEGORY_PAGE_LIMIT + 1 : 0;
  const pageEnd = Math.min(page * CATEGORY_PAGE_LIMIT, pagination.total);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (option) => {
    setStatusFilter(option.value);
    setPage(1);
  };

  const openCreateModal = () => {
    setSelectedExamTypes([]);
    setModalState({ isOpen: true, mode: "create", category: null });
  };

  const openEditModal = (category) => {
    setSelectedExamTypes(category.examTypes || []);
    setModalState({ isOpen: true, mode: "edit", category });
  };

  const openViewModal = (category) => {
    setSelectedExamTypes(category.examTypes || []);
    setModalState({ isOpen: true, mode: "view", category });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  };

  const drillIntoCategory = (category) => {
    setSelectedParentId(category.id);
    resetFilters();
  };

  const handleSubmit = async (categoryInput) => {
    if (modalState.mode === "edit" && modalState.category) {
      const formData = buildCategoryUpdateFormData(
        categoryInput,
        modalState.category,
      );

      if (!hasFormDataEntries(formData)) {
        toast.success("No category changes to save.");
        return true;
      }

      try {
        const response = await updateCategory({
          id: modalState.category.id,
          body: formData,
        }).unwrap();
        const updatedCategory =
          normalizeCategory(extractCategoryFromResponse(response)) ||
          modalState.category;
        toast.success(`${updatedCategory.name} updated.`);
        return true;
      } catch (updateError) {
        toast.error(
          getApiErrorMessage(updateError, "Failed to update category."),
        );
        return false;
      }
    }

    try {
      const response = await createCategory(
        buildCategoryCreateFormData(categoryInput),
      ).unwrap();
      const createdCategory =
        normalizeCategory(extractCategoryFromResponse(response)) ||
        categoryInput;
      toast.success(`${createdCategory.name} created.`);
      setSearchQuery("");
      setStatusFilter("all");
      setPage(1);
      return true;
    } catch (createError) {
      toast.error(
        getApiErrorMessage(createError, "Failed to create category."),
      );
      return false;
    }
  };

  const handleDelete = async (category) => {
    const descendantCount = categoryIndex.descendantCounts.get(category.id) || 0;
    const confirmed = window.confirm(
      descendantCount > 0
        ? `Delete ${category.name} and ${descendantCount} nested categor${descendantCount === 1 ? "y" : "ies"}?`
        : `Delete ${category.name}?`,
    );
    if (!confirmed) return;

    try {
      await deleteCategory(category.id).unwrap();
      toast.success(`${category.name} deleted.`);

      if (filteredCategories.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Failed to delete category."),
      );
    }
  };

  const handleStatusChange = async (category, checked) => {
    setPendingStatusIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(category.id);
      return nextIds;
    });

    try {
      await updateCategoryStatus({
        id: category.id,
        status: checked,
      }).unwrap();
      toast.success(`${category.name} status updated.`);
    } catch (statusError) {
      toast.error(
        getApiErrorMessage(statusError, "Failed to update category status."),
      );
    } finally {
      setPendingStatusIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(category.id);
        return nextIds;
      });
    }
  };

  const initialError = initialData?._error ? initialData : null;
  const activeError = error || initialError;
  const showParentColumn = Boolean(selectedCategory);
  const tableTitle = selectedCategory ? selectedCategory.name : "Categories";
  const tableSummary = `${filteredCategories.length} ${
    selectedCategory ? "direct sub-categories" : "main categories"
  } on this page`;
  const emptyTableColSpan = showParentColumn ? 6 : 5;

  if ((isLoading || !hasHydratedInitialData) && !data && !activeError) {
    return <GlobalSpinner label="Loading categories..." />;
  }

  if (activeError && !data?.categories?.length) {
    return (
      <ErrorCard
        title="Unable to load categories"
        message={getApiErrorMessage(
          activeError,
          "The category list could not be loaded.",
        )}
        onRetry={error ? refetch : undefined}
      />
    );
  }

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
            Create parent categories, upload icons, and drill into each level
            from the sub-category count.
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
                onChange={handleSearchChange}
                className="field-input"
                placeholder="Search categories..."
                aria-label="Search categories"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={CATEGORY_STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
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
            {selectedCategory && <h2 className="sr-only">{tableTitle}</h2>}
            <p className="text-sm text-muted">{tableSummary}</p>
            <p className="text-sm text-muted">
              Showing {pageStart}-{pageEnd} of {pagination.total} API entries
            </p>
          </div>

          <div className="flex min-h-10 items-center gap-2">
            <div className="flex min-w-28 justify-end">
              {isFetching && !isLoading ? (
                <GlobalSpinner label="Refreshing..." compact />
              ) : null}
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
                      ? categoryIndex.categoriesById.get(category.parentId) ||
                        category.parent
                      : null;

                  return (
                    <TableRow key={category.id}>
                      <TableTd className="font-mono text-xs text-muted">
                        {String(
                          (page - 1) * CATEGORY_PAGE_LIMIT + index + 1,
                        ).padStart(2, "0")}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-72 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft text-brand-strong">
                            {category.icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={category.icon}
                                alt={`${category.name} icon`}
                                className="h-full w-full object-cover"
                              />
                            ) : directChildCount > 0 ? (
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
                              ID: {category.id}
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
                          checked={category.status}
                          disabled={pendingStatusIds.has(category.id)}
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
                          onView={openViewModal}
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

        <Pagination
          currentPage={page}
          totalItems={pagination.total}
          itemsPerPage={CATEGORY_PAGE_LIMIT}
          onPageChange={setPage}
        />
      </TableContainer>

      <CategoryModal
        category={modalState.mode === "view" ? detailCategory : modalState.category}
        defaultParentId={selectedCategory?.id || ROOT_PARENT_VALUE}
        detailError={detailError}
        detailLoading={isFetchingDetail && !detailData}
        isOpen={modalState.isOpen}
        isSubmitting={isCreating || isUpdating}
        mode={modalState.mode}
        parentOptions={parentOptions}
        examTypes={selectedExamTypes}
        examTypeOptions={examTypeOptions}
        onExamTypesChange={setSelectedExamTypes}
        onClose={closeModal}
        onRetryDetail={refetchDetail}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
