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
  subjectsApi,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetAllSubjectQuery,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  useUpdateSubjectStatusMutation,
} from "@/features/subjects/api/subjectsApi";
import { SUBJECT_STATUS_OPTIONS } from "@/lib/subjectData";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { ROOT_SUBJECT_VALUE } from "./SubjectForm";
import { SubjectDetailModal } from "./SubjectDetailModal";
import { SubjectIcon } from "./SubjectIcon";
import { SubjectModal } from "./SubjectModal";
import {
  buildSubjectCreateFormData,
  buildSubjectUpdateFormData,
  getApiErrorMessage,
  getDirectChildCount,
  getSubjectChildrenCount,
  getSubjectPagination,
  normalizeSubject,
  normalizeSubjects,
} from "./subjectUtils";

const SUBJECT_PAGE_LIMIT = 10;
const INITIAL_QUERY_ARGS = {
  search: "",
  page: 1,
  limit: SUBJECT_PAGE_LIMIT,
  parentID: undefined,
  status: undefined,
};

function SubjectActionMenu({ disabled, onDelete, onEdit, onView, subject }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${subject.name}`}
      menuHeight={144}
    >
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              closeMenu();
              onView(subject);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Eye size={15} className="text-muted" />
            View
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              closeMenu();
              onEdit(subject);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Pencil size={15} className="text-muted" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              closeMenu();
              onDelete(subject);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </FloatingActionMenu>
  );
}

function statusFilterToApiValue(statusFilter) {
  if (statusFilter === "active") return true;
  if (statusFilter === "inactive") return false;
  return undefined;
}

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function mergeSubjects(...subjectLists) {
  const subjectsById = new Map();

  subjectLists.flat().forEach((subject) => {
    if (!subject?.id || subjectsById.has(String(subject.id))) return;
    subjectsById.set(String(subject.id), subject);
  });

  return Array.from(subjectsById.values());
}

function buildChildrenMap(subjects) {
  const childrenMap = new Map();

  subjects.forEach((subject) => {
    const parentKey = subject.parentId ? String(subject.parentId) : "root";
    const children = childrenMap.get(parentKey) || [];
    children.push(subject);
    childrenMap.set(parentKey, children);
  });

  return childrenMap;
}

function addDescendantIds(childrenMap, subjectId, excludedIds) {
  const children = childrenMap.get(String(subjectId)) || [];

  children.forEach((childSubject) => {
    const childId = String(childSubject.id);
    excludedIds.add(childId);
    addDescendantIds(childrenMap, childId, excludedIds);
  });
}

function buildParentOptions(subjects, excludedIds = new Set()) {
  const options = [];
  const childrenMap = buildChildrenMap(subjects);
  const visitedIds = new Set();

  const walk = (parentKey = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentKey) || []);

    children.forEach((subject) => {
      const subjectId = String(subject.id);
      if (visitedIds.has(subjectId) || excludedIds.has(subjectId)) return;

      visitedIds.add(subjectId);
      const path = [...parentPath, subject.name];
      options.push({
        label: subject.name,
        value: subject.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(subjectId, depth + 1, path);
    });
  };

  walk();

  sortByName(subjects).forEach((subject) => {
    const subjectId = String(subject.id);
    if (visitedIds.has(subjectId) || excludedIds.has(subjectId)) return;

    visitedIds.add(subjectId);
    options.push({
      label: subject.name,
      value: subject.id,
      depth: 0,
      meta: subject.name,
      searchText: subject.name,
    });
  });

  return options;
}

export function SubjectManager({ initialData }) {
  const dispatch = useDispatch();
  const [selectedParentStack, setSelectedParentStack] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [subjectModalState, setSubjectModalState] = useState({
    isOpen: false,
    mode: "create",
    subject: null,
  });
  const [viewSubjectFallback, setViewSubjectFallback] = useState(null);
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () => !initialData || Boolean(initialData._error),
  );
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const selectedParent =
    selectedParentStack.length > 0
      ? selectedParentStack[selectedParentStack.length - 1]
      : null;
  const selectedParentId = selectedParent?.id ?? null;

  useEffect(() => {
    if (!initialData || initialData._error) return;

    dispatch(
      subjectsApi.util.upsertQueryData(
        "getAllSubject",
        INITIAL_QUERY_ARGS,
        initialData,
      ),
    );
    queueMicrotask(() => setHasHydratedInitialData(true));
  }, [dispatch, initialData]);

  const queryArgs = useMemo(
    () => ({
      search: deferredSearchQuery,
      page,
      limit: SUBJECT_PAGE_LIMIT,
      parentID: selectedParentId ?? undefined,
      status: statusFilterToApiValue(statusFilter),
    }),
    [deferredSearchQuery, page, selectedParentId, statusFilter],
  );

  const shouldUseInitialData =
    !hasHydratedInitialData &&
    page === 1 &&
    deferredSearchQuery === "" &&
    statusFilter === "all" &&
    !selectedParentId &&
    Boolean(initialData) &&
    !initialData?._error;

  const {
    data: queryData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllSubjectQuery(queryArgs, {
    skip: shouldUseInitialData,
    placeholderData: shouldUseInitialData ? initialData : undefined,
  });
  const { data: parentOptionsData } = useGetAllSubjectQuery({
    page: 1,
    limit: 1000,
  });
  const [createSubject, { isLoading: isCreating }] =
    useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdating }] =
    useUpdateSubjectMutation();
  const [updateSubjectStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSubjectStatusMutation();
  const [deleteSubject, { isLoading: isDeleting }] =
    useDeleteSubjectMutation();

  const data = shouldUseInitialData ? initialData : queryData;
  const fetchedSubjects = useMemo(
    () => sortByName(normalizeSubjects(data?.subjects)),
    [data],
  );
  const parentOptionSubjects = useMemo(
    () =>
      mergeSubjects(
        normalizeSubjects(parentOptionsData?.subjects),
        fetchedSubjects,
        selectedParentStack,
      ),
    [fetchedSubjects, parentOptionsData, selectedParentStack],
  );
  const subjects = useMemo(() => {
    if (selectedParentId) {
      return fetchedSubjects.filter(
        (subject) => String(subject.parentId ?? "") === String(selectedParentId),
      );
    }

    return fetchedSubjects.filter((subject) => !subject.parentId);
  }, [fetchedSubjects, selectedParentId]);
  const pagination = selectedParentId
    ? getSubjectPagination(data, page, SUBJECT_PAGE_LIMIT)
    : getSubjectPagination(
        { ...data, subjects, total: subjects.length },
        page,
        SUBJECT_PAGE_LIMIT,
      );
  const pageStart =
    pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);
  const parentOptions = useMemo(() => {
    const excludedIds = new Set();
    const childrenMap = buildChildrenMap(parentOptionSubjects);

    if (subjectModalState.mode === "edit" && subjectModalState.subject) {
      const subjectId = String(subjectModalState.subject.id);
      excludedIds.add(subjectId);
      addDescendantIds(childrenMap, subjectId, excludedIds);
    }

    return buildParentOptions(parentOptionSubjects, excludedIds);
  }, [parentOptionSubjects, subjectModalState.mode, subjectModalState.subject]);
  const viewSubjectId = viewSubjectFallback?.id;
  const {
    data: detailData,
    error: detailError,
    isFetching: isFetchingDetails,
  } = useGetSubjectByIdQuery(viewSubjectId, {
    skip: !viewSubjectId,
  });
  const detailSubject =
    normalizeSubject(detailData?.subject) || viewSubjectFallback;
  const detailParent =
    normalizeSubject(detailData?.subject?.parent) ||
    (detailSubject?.parentId === selectedParentId ? selectedParent : null);
  const childCount = getSubjectChildrenCount(detailSubject);
  const initialError = initialData?._error && !queryData ? initialData : null;
  const activeError = error || initialError;
  const isBusy =
    isCreating || isUpdating || isUpdatingStatus || isDeleting || isFetchingDetails;

  useEffect(() => {
    if (!detailError) return;
    toast.error(
      getApiErrorMessage(detailError, "Subject details could not be loaded."),
    );
  }, [detailError]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  };

  const openCreateSubjectModal = () => {
    setSubjectModalState({ isOpen: true, mode: "create", subject: null });
  };

  const openEditSubjectModal = (subject) => {
    setSubjectModalState({ isOpen: true, mode: "edit", subject });
  };

  const closeSubjectModal = () => {
    setSubjectModalState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));
  };

  const drillIntoSubject = (subject) => {
    setSelectedParentStack((currentStack) => [...currentStack, subject]);
    setPage(1);
    resetFilters();
  };

  const goToRoot = () => {
    setSelectedParentStack([]);
    resetFilters();
  };

  const goToBreadcrumb = (subjectIndex) => {
    setSelectedParentStack((currentStack) =>
      currentStack.slice(0, subjectIndex + 1),
    );
    resetFilters();
  };

  const goBackOneLevel = () => {
    setSelectedParentStack((currentStack) => currentStack.slice(0, -1));
    resetFilters();
  };

  const handleSubjectSubmit = async (subjectInput) => {
    if (subjectModalState.mode === "edit" && subjectModalState.subject) {
      const formData = buildSubjectUpdateFormData(
        subjectInput,
        subjectModalState.subject,
      );

      if (Array.from(formData.keys()).length === 0) {
        toast.success("No subject changes to save.");
        return true;
      }

      try {
        const response = await updateSubject({
          id: subjectModalState.subject.id,
          body: formData,
        }).unwrap();
        toast.success(
          `${response?.subject?.name || subjectInput.name} updated.`,
        );
        return true;
      } catch (updateError) {
        toast.error(
          getApiErrorMessage(updateError, "Failed to update subject."),
        );
        return false;
      }
    }

    try {
      const response = await createSubject(
        buildSubjectCreateFormData(subjectInput),
      ).unwrap();
      toast.success(`${response?.subject?.name || subjectInput.name} created.`);
      setPage(1);
      return true;
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, "Failed to create subject."));
      return false;
    }
  };

  const handleSubjectDelete = async (subject) => {
    const childSubjectCount = getSubjectChildrenCount(subject);
    const confirmed = window.confirm(
      childSubjectCount > 0
        ? `Delete ${subject.name} and ${childSubjectCount} nested subject${childSubjectCount === 1 ? "" : "s"}?`
        : `Delete ${subject.name}?`,
    );
    if (!confirmed) return;

    try {
      await deleteSubject(subject.id).unwrap();
      toast.success(`${subject.name} deleted.`);

      if (subjects.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete subject."));
    }
  };

  const handleSubjectStatusChange = async (subject, checked) => {
    try {
      await updateSubjectStatus({
        id: subject.id,
        status: String(checked),
      }).unwrap();
      toast.success(`${subject.name} status updated.`);
    } catch (statusError) {
      toast.error(
        getApiErrorMessage(statusError, "Failed to update subject status."),
      );
    }
  };

  if ((isLoading || !hasHydratedInitialData) && !data && !activeError) {
    return <GlobalSpinner label="Loading subjects..." />;
  }

  if (activeError && !data?.subjects?.length) {
    return (
      <ErrorCard
        title="Unable to load subjects"
        message={getApiErrorMessage(
          activeError,
          "The subject list could not be loaded.",
        )}
        onRetry={error ? refetch : undefined}
      />
    );
  }

  const showParentColumn = Boolean(selectedParent);
  const tableTitle = selectedParent ? selectedParent.name : "Subjects";
  const tableSummary = `Showing ${pageStart}-${pageEnd} of ${pagination.total} ${
    selectedParent ? "direct sub-subjects" : "subjects"
  }`;
  const emptyTableColSpan = showParentColumn ? 7 : 6;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam subjects
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Subject hierarchy
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Create subjects, nest sub-subjects under any parent, and manage
            active status from the subject list.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Listed</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {pagination.total}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Page</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {pagination.page}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Topics</p>
            <p className="mt-1 text-xl font-black text-foreground">0</p>
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
                placeholder="Search subjects..."
                aria-label="Search subjects"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={SUBJECT_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(option) => {
              setStatusFilter(option.value);
              setPage(1);
            }}
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
            onClick={openCreateSubjectModal}
          >
            <Plus size={16} />
            {selectedParent ? "Create sub-subject" : "Create subject"}
          </button>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            {selectedParent ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-brand-strong transition-colors hover:bg-brand-soft"
                  onClick={goToRoot}
                >
                  Subjects
                </button>
                {selectedParentStack.map((subject, index) => (
                  <span
                    key={subject.id}
                    className="inline-flex min-w-0 items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-border-strong" />
                    <button
                      type="button"
                      className={`max-w-44 truncate rounded-md px-2 py-1 transition-colors ${
                        subject.id === selectedParent?.id
                          ? "bg-brand-soft text-brand-strong"
                          : "text-brand-strong hover:bg-brand-soft"
                      }`}
                      onClick={() => goToBreadcrumb(index)}
                    >
                      {subject.name}
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <h2 className="text-base font-semibold text-foreground">
                {tableTitle}
              </h2>
            )}
            {selectedParent && <h2 className="sr-only">{tableTitle}</h2>}
            <p className="text-sm text-muted">{tableSummary}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 min-w-28 items-center justify-end">
              {isFetching && !isLoading && (
                <GlobalSpinner
                  label="Refreshing..."
                  compact
                  className="h-10 py-0"
                />
              )}
            </div>
            {selectedParent && (
              <button
                type="button"
                className="button button-secondary"
                onClick={goBackOneLevel}
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
                <TableTh>Subject</TableTh>
                {showParentColumn && <TableTh>Parent</TableTh>}
                <TableTh>Sub-subjects</TableTh>
                <TableTh>Topics</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {subjects.length > 0 ? (
                subjects.map((subject, index) => {
                  const directChildCount = getDirectChildCount(
                    subject,
                    parentOptionSubjects,
                  );
                  const parent = selectedParent || normalizeSubject(subject.parent);

                  return (
                    <TableRow key={subject.id}>
                      <TableTd className="font-mono text-xs text-muted">
                        {String(
                          (page - 1) * SUBJECT_PAGE_LIMIT + index + 1,
                        ).padStart(2, "0")}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-72 items-start gap-3">
                          <SubjectIcon
                            icon={subject.icon}
                            name={subject.name}
                            className="mt-0.5 h-9 w-9 text-xs"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="text-left font-semibold text-foreground transition-colors hover:text-brand-strong"
                              onClick={() => drillIntoSubject(subject)}
                            >
                              {subject.name}
                            </button>
                            <p className="mt-1 text-xs font-medium text-muted">
                              {subject.parentId
                                ? "Sub-subject"
                                : "Main subject"}
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
                            onClick={() => drillIntoSubject(subject)}
                            aria-label={`Show ${directChildCount} sub-subjects of ${subject.name}`}
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
                        <span className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-sm font-bold text-muted">
                          0
                        </span>
                      </TableTd>
                      <TableTd>
                        <StatusToggle
                          checked={subject.status === "active"}
                          disabled={isUpdatingStatus}
                          label={`Set ${subject.name} active status`}
                          onChange={(checked) =>
                            handleSubjectStatusChange(subject, checked)
                          }
                        />
                      </TableTd>
                      <TableTd>
                        <SubjectActionMenu
                          disabled={isBusy}
                          subject={subject}
                          onDelete={handleSubjectDelete}
                          onEdit={openEditSubjectModal}
                          onView={setViewSubjectFallback}
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
                      No subjects found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a subject at this level.
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
          itemsPerPage={pagination.limit || SUBJECT_PAGE_LIMIT}
          onPageChange={setPage}
        />
      </TableContainer>

      <SubjectModal
        defaultParentId={selectedParent?.id || ROOT_SUBJECT_VALUE}
        isSubmitting={isCreating || isUpdating}
        isOpen={subjectModalState.isOpen}
        mode={subjectModalState.mode}
        parentOptions={parentOptions}
        subject={subjectModalState.subject}
        onClose={closeSubjectModal}
        onSubmit={handleSubjectSubmit}
      />

      <SubjectDetailModal
        childCount={childCount}
        isOpen={Boolean(viewSubjectFallback)}
        parent={detailParent}
        subject={detailSubject}
        topicCount={0}
        onClose={() => setViewSubjectFallback(null)}
      />
    </div>
  );
}
