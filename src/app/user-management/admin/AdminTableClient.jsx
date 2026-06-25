"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import { ErrorCard } from "@/components/ui/ErrorCard";
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
  authApi,
  useDeleteAdminMutation,
  useGetAdminProfileQuery,
  useGetAllAdminsQuery,
  useRegisterAdminMutation,
} from "@/features/auth/api/authApi";
import { AdminActionMenu } from "@/features/users/admin/AdminActionMenu";
import { AdminAvatar } from "@/features/users/admin/AdminAvatar";
import { CreateAdminModal } from "@/features/users/admin/CreateAdminModal";
import {
  getApiErrorMessage,
  normalizeAdmin,
} from "@/features/users/admin/adminUtils";
import { getRoleLabel } from "@/lib/adminData";
import { Plus, ShieldCheck, UsersRound } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const ADMIN_PAGE_LIMIT = 10;
const INITIAL_QUERY_ARGS = {
  search: "",
  page: 1,
  limit: ADMIN_PAGE_LIMIT,
};

export default function AdminTableClient({ initialData }) {
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
      authApi.util.upsertQueryData(
        "getAllAdmins",
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
      limit: ADMIN_PAGE_LIMIT,
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
  } = useGetAllAdminsQuery(queryArgs, {
    skip: shouldUseInitialData,
    placeholderData: shouldUseInitialData ? initialData : undefined,
  });

  const { data: profileData, isLoading: isProfileLoading } =
    useGetAdminProfileQuery();
  const [registerAdmin, { isLoading: isCreating }] =
    useRegisterAdminMutation();
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation();

  const data = shouldUseInitialData ? initialData : queryData;
  const admins = useMemo(
    () => (data?.admins || []).map(normalizeAdmin).filter(Boolean),
    [data],
  );
  const pagination = data?.pagination || {
    total: 0,
    page,
    limit: ADMIN_PAGE_LIMIT,
    totalPages: 0,
  };
  const canManageAdmins = Boolean(profileData?.admin?.isSuperAdmin);
  const superAdminCount = admins.filter((admin) => admin.isSuperAdmin).length;
  const subAdminCount = admins.length - superAdminCount;
  const pageStart =
    pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const handleSearchChange = (nextSearch) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const handleCreate = async (adminInput) => {
    try {
      const response = await registerAdmin({
        name: adminInput.name,
        email: adminInput.email,
        phone: adminInput.phone,
        password: adminInput.password,
        isSuperAdmin: "false",
      }).unwrap();

      toast.success(`${response?.admin?.name || adminInput.name} created.`);
      setSearch("");
      setPage(1);
      return true;
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, "Failed to create admin."));
      return false;
    }
  };

  const handleDelete = async (admin) => {
    if (!canManageAdmins) {
      toast.error("Only super admins can delete admins.");
      return;
    }

    if (admin.isSuperAdmin) {
      toast.error("The super admin account cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(`Delete ${admin.name}?`);
    if (!confirmed) return;

    try {
      await deleteAdmin(admin.id).unwrap();
      toast.success(`${admin.name} deleted.`);
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete admin."));
    }
  };

  const initialError = initialData?._error ? initialData : null;
  const activeError = error || initialError;

  if (
    (isLoading || !hasHydratedInitialData) &&
    !data &&
    !activeError
  ) {
    return <GlobalSpinner label="Loading admins..." />;
  }

  if (activeError && !data?.admins?.length) {
    return (
      <ErrorCard
        title="Unable to load admins"
        message={getApiErrorMessage(
          activeError,
          "The admin list could not be loaded.",
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
            Admin accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create sub-admins, review account details, and control which admin
            panel menus each account can access.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
          disabled={!canManageAdmins || isProfileLoading}
        >
          <Plus size={16} />
          Create admin
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                Super admins on page
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {superAdminCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
              <ShieldCheck size={21} />
            </div>
          </div>
        </article>

        <article className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                Sub admins on page
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {subAdminCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent text-sidebar">
              <UsersRound size={21} />
            </div>
          </div>
        </article>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Admin list
            </h2>
            <p className="text-sm text-muted">
              Showing {pageStart}-{pageEnd} of {pagination.total} accounts
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isFetching && !isLoading && (
              <GlobalSpinner label="Refreshing..." compact />
            )}
            <CustomSearch
              placeholder="Search admins..."
              searchQuery={search}
              setSearchQuery={handleSearchChange}
              ariaLabel="Search admins"
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
                <TableTh>Role</TableTh>
                <TableTh>Created</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {admins.length > 0 ? (
                admins.map((admin, index) => (
                  <TableRow key={admin.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String((page - 1) * ADMIN_PAGE_LIMIT + index + 1).padStart(
                        2,
                        "0",
                      )}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-48 items-center gap-3">
                        <AdminAvatar admin={admin} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {admin.name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            ID: {admin.id}
                          </p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="whitespace-nowrap">
                      {admin.phone}
                    </TableTd>
                    <TableTd>{admin.email}</TableTd>
                    <TableTd>
                      <span className="whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-strong">
                        {getRoleLabel(admin.role)}
                      </span>
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-muted">
                      {admin.createdAt
                        ? new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(new Date(admin.createdAt))
                        : "N/A"}
                    </TableTd>
                    <TableTd>
                      <AdminActionMenu
                        admin={admin}
                        onDelete={handleDelete}
                        canDelete={canManageAdmins}
                        isDeleting={isDeleting}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No admins found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new admin.
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
          itemsPerPage={ADMIN_PAGE_LIMIT}
          onPageChange={setPage}
        />
      </TableContainer>

      <CreateAdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
