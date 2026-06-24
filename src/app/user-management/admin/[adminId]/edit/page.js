"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { StatusToggle } from "@/components/ui/StatusToggle";
import {
  useChangeSuperAdminStatusMutation,
  useGetAdminByIdQuery,
  useUpdateAdminProfileMutation,
} from "@/features/auth/api/authApi";
import { AdminForm } from "@/features/users/admin/AdminForm";
import { AdminNotFound } from "@/features/users/admin/AdminNotFound";
import {
  getApiErrorMessage,
  normalizeAdmin,
} from "@/features/users/admin/adminUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditAdminPage() {
  const { adminId } = useParams();
  const router = useRouter();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetAdminByIdQuery(adminId);
  const [updateAdminProfile, { isLoading: isUpdating }] =
    useUpdateAdminProfileMutation();
  const [changeSuperAdminStatus, { isLoading: isUpdatingStatus }] =
    useChangeSuperAdminStatusMutation();
  const admin = normalizeAdmin(data?.admin);

  if (isLoading) return <GlobalSpinner label="Loading admin..." />;

  if (error?.status === 404) return <AdminNotFound />;
  if (error) {
    return (
      <ErrorCard
        title="Unable to load admin"
        message={getApiErrorMessage(error, "The admin profile could not load.")}
        onRetry={refetch}
      />
    );
  }
  if (!admin) return <AdminNotFound />;

  const handleSubmit = async (adminInput) => {
    const changedPayload = {};

    if (adminInput.name !== admin.name) {
      changedPayload.name = adminInput.name;
    }

    if (adminInput.email !== admin.email) {
      changedPayload.email = adminInput.email;
    }

    if (adminInput.phone !== admin.phone) {
      changedPayload.phone = adminInput.phone;
    }

    if (Object.keys(changedPayload).length === 0) {
      toast.error("No profile changes to save.");
      return;
    }

    try {
      await updateAdminProfile(changedPayload).unwrap();
      toast.success(`${adminInput.name} updated.`);
      router.push(`/user-management/admin/${admin.id}/view`);
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, "Failed to update admin."));
    }
  };

  const handleStatusChange = async (nextIsSuperAdmin) => {
    try {
      await changeSuperAdminStatus({
        id: admin.id,
        isSuperAdmin: String(nextIsSuperAdmin),
      }).unwrap();
      toast.success(`${admin.name} role updated.`);
      refetch();
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, "Failed to update role."));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/user-management/admin" className="back-link">
          <ArrowLeft size={14} />
          Back to admins
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Edit admin
        </h1>
        <p className="mt-2 text-sm text-muted">
          Update profile details for {admin.name}.
        </p>
      </div>

      <section className="surface-card p-5">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Super admin role
            </p>
            <p className="mt-1 text-sm text-muted">
              This updates immediately and is saved separately from profile
              details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusToggle
              checked={admin.isSuperAdmin}
              disabled={isUpdatingStatus}
              label={`Toggle super admin role for ${admin.name}`}
              onChange={handleStatusChange}
            />
            <span className="whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">
              {admin.isSuperAdmin ? "Super Admin" : "Sub Admin"}
            </span>
          </div>
        </div>

        <AdminForm
          admin={admin}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
          secondaryAction={
            <Link
              href={`/user-management/admin/${admin.id}/view`}
              className="button button-secondary"
            >
              Cancel
            </Link>
          }
        />
      </section>
    </div>
  );
}
