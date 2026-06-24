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
  studentApi,
  useDeleteStudentByAdminMutation,
  useGetAllStudentsQuery,
  useRegisterStudentMutation,
  useUpdateStudentStatusMutation,
} from "@/features/users/student/api/studentApi";
import { CreateStudentModal } from "@/features/users/student/CreateStudentModal";
import { StudentActionMenu } from "@/features/users/student/StudentActionMenu";
import {
  appendIfPresent,
  getApiErrorMessage,
  normalizeStudent,
} from "@/features/users/student/studentUtils";
import { Plus } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const STUDENT_PAGE_LIMIT = 10;
const INITIAL_QUERY_ARGS = {
  search: "",
  page: 1,
  limit: STUDENT_PAGE_LIMIT,
};
const EMPTY_VALUE = "N/A";

function buildStudentCreateFormData(studentInput) {
  const formData = new FormData();

  formData.append("name", studentInput.name);
  formData.append("phone", studentInput.phone);
  formData.append("email", studentInput.email);
  formData.append("password", studentInput.password);
  appendIfPresent(formData, "status", studentInput.status);
  appendIfPresent(formData, "gender", studentInput.gender);
  appendIfPresent(formData, "image", studentInput.image);

  return formData;
}

export default function StudentTableClient({ initialData }) {
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
      studentApi.util.upsertQueryData(
        "getAllStudents",
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
      limit: STUDENT_PAGE_LIMIT,
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
  } = useGetAllStudentsQuery(queryArgs, {
    skip: shouldUseInitialData,
    placeholderData: shouldUseInitialData ? initialData : undefined,
  });
  const [registerStudent, { isLoading: isCreating }] =
    useRegisterStudentMutation();
  const [deleteStudentByAdmin, { isLoading: isDeleting }] =
    useDeleteStudentByAdminMutation();
  const [updateStudentStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStudentStatusMutation();

  const data = shouldUseInitialData ? initialData : queryData;
  const students = useMemo(
    () => (data?.students || []).map(normalizeStudent).filter(Boolean),
    [data],
  );
  const pagination = data?.pagination || {
    total: 0,
    page,
    limit: STUDENT_PAGE_LIMIT,
    totalPages: 0,
  };
  const pageStart =
    pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const handleCreate = async (studentInput) => {
    try {
      const response = await registerStudent(
        buildStudentCreateFormData(studentInput),
      ).unwrap();

      toast.success(`${response?.student?.name || studentInput.name} created.`);
      setSearch("");
      setPage(1);
      return true;
    } catch (createError) {
      toast.error(
        getApiErrorMessage(createError, "Failed to create student."),
      );
      return false;
    }
  };

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete ${student.name}?`);
    if (!confirmed) return;

    try {
      await deleteStudentByAdmin(student.id).unwrap();
      toast.success(`${student.name} deleted.`);
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Failed to delete student."),
      );
    }
  };

  const handleStatusChange = async (student, isActive) => {
    try {
      await updateStudentStatus({
        id: student.id,
        status: String(isActive),
      }).unwrap();
      toast.success(`${student.name} status updated.`);
    } catch (statusError) {
      toast.error(
        getApiErrorMessage(statusError, "Failed to update status."),
      );
    }
  };

  const initialError = initialData?._error ? initialData : null;
  const activeError = error || initialError;

  if ((isLoading || !hasHydratedInitialData) && !data && !activeError) {
    return <GlobalSpinner label="Loading students..." />;
  }

  if (activeError && !data?.students?.length) {
    return (
      <ErrorCard
        title="Unable to load students"
        message={getApiErrorMessage(
          activeError,
          "The student list could not be loaded.",
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
            Student accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create students, review contact details, and control active access
            status.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          Create student
        </button>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Student list
            </h2>
            <p className="text-sm text-muted">
              Showing {pageStart}-{pageEnd} of {pagination.total} students
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isFetching && !isLoading && (
              <GlobalSpinner label="Refreshing..." compact />
            )}
            <CustomSearch
              placeholder="Search students..."
              searchQuery={search}
              setSearchQuery={handleSearchChange}
              ariaLabel="Search students"
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
                <TableTh>Email</TableTh>
                <TableTh>Created</TableTh>
                <TableTh>Reg ID</TableTh>
                <TableTh>Purchased Package</TableTh>
                <TableTh>Purchase Amount</TableTh>
                <TableTh>Preli Exam</TableTh>
                <TableTh>Written Exam</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(
                        (page - 1) * STUDENT_PAGE_LIMIT + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="min-w-48">
                        <p className="font-semibold text-foreground">
                          {student.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          ID: {student.id}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd className="whitespace-nowrap">
                      {student.phone}
                    </TableTd>
                    <TableTd>{student.email}</TableTd>
                    <TableTd className="whitespace-nowrap text-muted">
                      {student.createdAt
                        ? new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(new Date(student.createdAt))
                        : EMPTY_VALUE}
                    </TableTd>
                    <TableTd className="whitespace-nowrap font-mono text-xs text-muted">
                      {student.registrationId || EMPTY_VALUE}
                    </TableTd>
                    <TableTd>{student.purchasedPackage || EMPTY_VALUE}</TableTd>
                    <TableTd className="whitespace-nowrap">
                      {student.purchaseAmount ?? EMPTY_VALUE}
                    </TableTd>
                    <TableTd>{student.preliminaryExam ?? EMPTY_VALUE}</TableTd>
                    <TableTd>{student.writtenExam ?? EMPTY_VALUE}</TableTd>
                    <TableTd>
                      <StatusToggle
                        checked={student.isActive}
                        disabled={isUpdatingStatus}
                        label={`Toggle status for ${student.name}`}
                        onChange={(isActive) =>
                          handleStatusChange(student, isActive)
                        }
                      />
                    </TableTd>
                    <TableTd>
                      <StudentActionMenu
                        student={student}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={12} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No students found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new student.
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
          itemsPerPage={STUDENT_PAGE_LIMIT}
          onPageChange={setPage}
        />
      </TableContainer>

      <CreateStudentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
