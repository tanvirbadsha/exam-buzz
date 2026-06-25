"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import { ErrorCard } from "@/components/ui/ErrorCard";
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
import {
  teacherApi,
  useDeleteTeacherByAdminMutation,
  useGetAllTeachersQuery,
  useRegisterTeacherMutation,
  useUpdateTeacherStatusMutation,
} from "@/features/users/teacher/api/teacherApi";
import { CreateTeacherModal } from "@/features/users/teacher/CreateTeacherModal";
import { TeacherActionMenu } from "@/features/users/teacher/TeacherActionMenu";
import {
  getApiErrorMessage,
  normalizeTeacher,
} from "@/features/users/teacher/teacherUtils";
import { Plus } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const TEACHER_PAGE_LIMIT = 10;
const INITIAL_QUERY_ARGS = {
  search: "",
  page: 1,
  limit: TEACHER_PAGE_LIMIT,
};
const EMPTY_VALUE = "N/A";

export default function TeacherTableClient({ initialData }) {
  const dispatch = useDispatch();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(1);
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () => !initialData || Boolean(initialData._error),
  );

  useEffect(() => {
    if (!initialData || initialData._error) {
      return;
    }

    dispatch(
      teacherApi.util.upsertQueryData(
        "getAllTeachers",
        INITIAL_QUERY_ARGS,
        initialData,
      ),
    );
    queueMicrotask(() => setHasHydratedInitialData(true));
  }, [dispatch, initialData]);

  const queryArgs = useMemo(
    () => ({
      search: deferredSearch,
      page,
      limit: TEACHER_PAGE_LIMIT,
    }),
    [deferredSearch, page],
  );

  const shouldUseInitialData =
    !hasHydratedInitialData &&
    page === 1 &&
    deferredSearch === "" &&
    Boolean(initialData) &&
    !initialData?._error;

  const {
    data: queryData,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllTeachersQuery(queryArgs, {
    skip: shouldUseInitialData,
    placeholderData: shouldUseInitialData ? initialData : undefined,
  });
  const [registerTeacher, { isLoading: isCreating }] =
    useRegisterTeacherMutation();
  const [deleteTeacherByAdmin, { isLoading: isDeleting }] =
    useDeleteTeacherByAdminMutation();
  const [updateTeacherStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTeacherStatusMutation();

  const data = shouldUseInitialData ? initialData : queryData;
  const teachers = useMemo(
    () => (data?.teachers || []).map(normalizeTeacher).filter(Boolean),
    [data],
  );
  const pagination = data?.pagination || {
    total: 0,
    page,
    limit: TEACHER_PAGE_LIMIT,
    totalPages: 0,
  };
  const pageStart =
    pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const handleCreate = async (teacherInput) => {
    try {
      const response = await registerTeacher(teacherInput).unwrap();
      toast.success(`${response?.teacher?.name || teacherInput.name} created.`);
      setSearch("");
      setPage(1);
      return true;
    } catch (createError) {
      toast.error(
        getApiErrorMessage(createError, "Failed to create teacher."),
      );
      return false;
    }
  };

  const handleDelete = async (teacher) => {
    const confirmed = window.confirm(`Delete ${teacher.name}?`);
    if (!confirmed) return;

    try {
      await deleteTeacherByAdmin(teacher.id).unwrap();
      toast.success(`${teacher.name} deleted.`);

      if (teachers.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Failed to delete teacher."),
      );
    }
  };

  const handleStatusChange = async (teacher, isActive) => {
    try {
      await updateTeacherStatus({
        id: teacher.id,
        status: String(isActive),
      }).unwrap();
      toast.success(`${teacher.name} status updated.`);
    } catch (statusError) {
      toast.error(
        getApiErrorMessage(statusError, "Failed to update status."),
      );
    }
  };

  const initialError = initialData?._error ? initialData : null;
  const activeError = error || initialError;

  if ((isLoading || !hasHydratedInitialData) && !data && !activeError) {
    return <GlobalSpinner label="Loading teachers..." />;
  }

  if (activeError && !data?.teachers?.length) {
    return (
      <ErrorCard
        title="Unable to load teachers"
        message={getApiErrorMessage(
          activeError,
          "The teacher list could not be loaded.",
        )}
        onRetry={error ? refetch : undefined}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            User management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Teacher accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage teacher accounts and paper assignment activity.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          Create teacher
        </button>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Teacher list
            </h2>
            <p className="text-sm text-muted">
              Showing {pageStart}-{pageEnd} of {pagination.total} teachers
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isFetching && !isLoading && (
              <GlobalSpinner label="Refreshing..." compact />
            )}
            <CustomSearch
              placeholder="Search teachers..."
              searchQuery={search}
              setSearchQuery={handleSearchChange}
              ariaLabel="Search teachers"
            />
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Name</TableTh>
                <TableTh>Phone</TableTh>
                <TableTh>Total Assign Paper</TableTh>
                <TableTh>Total Submitted Paper</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {teachers.length > 0 ? (
                teachers.map((teacher, index) => (
                  <TableRow key={teacher.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(
                        (page - 1) * TEACHER_PAGE_LIMIT + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="min-w-44">
                        <p className="font-semibold text-foreground">
                          {teacher.name || EMPTY_VALUE}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd className="whitespace-nowrap">
                      {teacher.phone || EMPTY_VALUE}
                    </TableTd>
                    <TableTd className="font-semibold text-foreground">
                      {teacher.totalAssignPaper ?? EMPTY_VALUE}
                    </TableTd>
                    <TableTd className="font-semibold text-foreground">
                      {teacher.totalSubmittedPaper ?? EMPTY_VALUE}
                    </TableTd>
                    <TableTd>
                      <StatusToggle
                        checked={teacher.isActive}
                        disabled={isUpdatingStatus}
                        label={`Toggle status for ${teacher.name}`}
                        onChange={(isActive) =>
                          handleStatusChange(teacher, isActive)
                        }
                      />
                    </TableTd>
                    <TableTd>
                      <TeacherActionMenu
                        teacher={teacher}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No teachers found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new teacher.
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
          itemsPerPage={TEACHER_PAGE_LIMIT}
          onPageChange={setPage}
        />
      </TableContainer>

      <CreateTeacherModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
