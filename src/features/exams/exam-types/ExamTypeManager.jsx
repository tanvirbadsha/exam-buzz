"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { Pagination } from "@/components/ui/Pagination";
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
import {
  examTypesApi,
  useCreateExamTypeMutation,
  useDeleteExamTypeMutation,
  useGetAllExamTypesQuery,
  useUpdateExamTypeMutation,
} from "@/features/exams/exam-types/api/examTypes";
import {
  buildExamTypeCreateFormData,
  buildExamTypeUpdateFormData,
  getExamTypeApiErrorMessage,
  hasFormDataEntries,
  normalizeExamType,
} from "@/features/exams/exam-types/examTypeUtils";
import {
  formatExamTypeDate,
  isExamTypeIconImage,
} from "@/lib/examTypeData";
import {
  ClipboardList,
  Eye,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { ExamTypeModal } from "./ExamTypeModal";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function parsePositiveInteger(value, fallback) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function ExamTypeIcon({ examType }) {
  if (isExamTypeIconImage(examType.icon)) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
        <Image
          src={examType.icon}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  if (examType.icon) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft px-2 text-xs font-black text-brand-strong">
        <span className="max-w-full truncate">{examType.icon}</span>
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
      <Layers3 size={18} />
    </span>
  );
}

function ExamTypeActionMenu({ examType, onDelete, onEdit }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${examType.name}`}
      menuHeight={136}
    >
      {({ closeMenu }) => (
        <>
          <Link
            href={`/exam-types/${examType.id}/view`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Eye size={15} className="text-muted" />
            View
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(examType);
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
              onDelete(examType);
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

export function ExamTypeManager({
  initialData,
  initialExamTypes,
  initialQuery,
}) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialResponse = useMemo(
    () => initialData || { examTypes: initialExamTypes || [] },
    [initialData, initialExamTypes],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    examType: null,
  });
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () => !initialResponse || Boolean(initialResponse._error),
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const currentPage = parsePositiveInteger(
    searchParams.get("page"),
    initialQuery?.page || DEFAULT_PAGE,
  );
  const itemsPerPage = parsePositiveInteger(
    searchParams.get("limit"),
    initialQuery?.limit || DEFAULT_LIMIT,
  );
  const queryArgs = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
    }),
    [currentPage, itemsPerPage],
  );

  useEffect(() => {
    if (searchParams.has("page") && searchParams.has("limit")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));
    router.replace(`${pathname}?${params.toString()}`);
  }, [currentPage, itemsPerPage, pathname, router, searchParams]);

  useEffect(() => {
    if (!initialResponse || initialResponse._error) {
      return;
    }

    dispatch(
      examTypesApi.util.upsertQueryData(
        "getAllExamTypes",
        initialQuery || queryArgs,
        initialResponse,
      ),
    );
    queueMicrotask(() => setHasHydratedInitialData(true));
  }, [dispatch, initialQuery, initialResponse, queryArgs]);

  const shouldUseInitialData =
    !hasHydratedInitialData &&
    Boolean(initialResponse) &&
    !initialResponse?._error;

  const {
    data: queryData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllExamTypesQuery(queryArgs, {
    skip: shouldUseInitialData,
  });
  const [createExamType, { isLoading: isCreating }] =
    useCreateExamTypeMutation();
  const [updateExamType, { isLoading: isUpdating }] =
    useUpdateExamTypeMutation();
  const [deleteExamType] = useDeleteExamTypeMutation();

  const data = shouldUseInitialData ? initialResponse : queryData;
  const examTypes = useMemo(
    () => (data?.examTypes || []).map(normalizeExamType).filter(Boolean),
    [data],
  );
  const pagination = data?.pagination || {
    total: examTypes.length,
    page: currentPage,
    limit: itemsPerPage,
    totalPages: Math.ceil(examTypes.length / itemsPerPage),
  };

  const filteredExamTypes = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) return examTypes;

    return examTypes.filter((examType) =>
      [examType.id, examType.name, examType.icon]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearchQuery, examTypes]);

  const activePage = pagination.page || currentPage;
  const totalItems =
    searchQuery.trim() && !data?.pagination?.total
      ? filteredExamTypes.length
      : pagination.total || examTypes.length;

  const updatePaginationUrl = (nextPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(itemsPerPage || DEFAULT_LIMIT));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (nextSearchQuery) => {
    setSearchQuery(nextSearchQuery);
    updatePaginationUrl(DEFAULT_PAGE);
  };

  const resetFilters = () => {
    setSearchQuery("");
    updatePaginationUrl(DEFAULT_PAGE);
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", examType: null });
  };

  const openEditModal = (examType) => {
    setModalState({ isOpen: true, mode: "edit", examType });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleSubmit = async (examTypeInput) => {
    if (modalState.mode === "edit" && modalState.examType) {
      const body = buildExamTypeUpdateFormData(
        examTypeInput,
        modalState.examType,
      );

      if (!hasFormDataEntries(body)) {
        toast.error("No changes to save.");
        return false;
      }

      try {
        const response = await updateExamType({
          id: modalState.examType.id,
          body,
        }).unwrap();
        toast.success(
          `${response?.examType?.name || examTypeInput.name} updated.`,
        );
        return true;
      } catch (updateError) {
        toast.error(
          getExamTypeApiErrorMessage(
            updateError,
            "Failed to update exam type.",
          ),
        );
        return false;
      }
    }

    try {
      const response = await createExamType(
        buildExamTypeCreateFormData(examTypeInput),
      ).unwrap();
      toast.success(`${response?.examType?.name || examTypeInput.name} created.`);
      resetFilters();
      return true;
    } catch (createError) {
      toast.error(
        getExamTypeApiErrorMessage(createError, "Failed to create exam type."),
      );
      return false;
    }
  };

  const handleDelete = async (examType) => {
    const confirmed = window.confirm(`Delete ${examType.name}?`);
    if (!confirmed) return;

    try {
      await deleteExamType(examType.id).unwrap();
      toast.success(`${examType.name} deleted.`);
    } catch (deleteError) {
      toast.error(
        getExamTypeApiErrorMessage(deleteError, "Failed to delete exam type."),
      );
    }
  };

  const initialError = initialResponse?._error ? initialResponse : null;
  const activeError = error || initialError;
  const isSubmitting = isCreating || isUpdating;

  if ((isLoading || !hasHydratedInitialData) && !data && !activeError) {
    return <GlobalSpinner label="Loading exam types..." />;
  }

  if (activeError && !examTypes.length) {
    return (
      <ErrorCard
        title="Unable to load exam types"
        message={getExamTypeApiErrorMessage(
          activeError,
          "The exam type list could not be loaded.",
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
            Exam management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Exam types
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Manage the top-level exam labels used when creating packages,
            materials, questions, and student exam activity.
          </p>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Total types</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {examTypes.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Visible</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {filteredExamTypes.length}
            </p>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Exam type list
              </h2>
              <p className="text-sm text-muted">
                Showing {filteredExamTypes.length} of {totalItems} exam types
              </p>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateModal}
              disabled={isSubmitting}
            >
              <Plus size={16} />
              Create exam type
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-end">
            <CustomSearch
              placeholder="Search by name, ID, or icon..."
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              ariaLabel="Search exam types"
              wide
            />
            <button
              type="button"
              className="button button-secondary min-h-10 lg:self-end"
              onClick={resetFilters}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
          {isFetching && !isLoading && (
            <div className="mt-3">
              <GlobalSpinner label="Refreshing..." compact />
            </div>
          )}
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Exam type</TableTh>
                <TableTh>Created</TableTh>
                <TableTh>Updated</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredExamTypes.length > 0 ? (
                filteredExamTypes.map((examType, index) => (
                  <TableRow key={examType.id}>
                    <TableTd className="font-mono text-xs text-muted">
                        {String(
                        (activePage - 1) * itemsPerPage + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-64 items-center gap-3">
                        <ExamTypeIcon examType={examType} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {examType.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted">
                            ID: {examType.id}
                          </p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="min-w-44 text-sm font-semibold text-foreground">
                      {formatExamTypeDate(examType.createdAt)}
                    </TableTd>
                    <TableTd className="min-w-44 text-sm text-muted">
                      {formatExamTypeDate(examType.updatedAt)}
                    </TableTd>
                    <TableTd>
                      <ExamTypeActionMenu
                        examType={examType}
                        onDelete={handleDelete}
                        onEdit={openEditModal}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={5} className="py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <ClipboardList size={20} />
                    </div>
                    <p className="mt-3 font-semibold text-foreground">
                      No exam types found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new exam type.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>

        <Pagination
          currentPage={activePage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={updatePaginationUrl}
        />
      </TableContainer>

      <ExamTypeModal
        examType={modalState.examType}
        isOpen={modalState.isOpen}
        isSubmitting={isSubmitting}
        mode={modalState.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
