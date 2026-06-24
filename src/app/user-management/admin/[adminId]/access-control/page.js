"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { useGetAdminByIdQuery } from "@/features/auth/api/authApi";
import { AdminAccessControlForm } from "@/features/users/admin/AdminAccessControlForm";
import { AdminNotFound } from "@/features/users/admin/AdminNotFound";
import {
  getApiErrorMessage,
  normalizeAdmin,
} from "@/features/users/admin/adminUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminAccessControlPage() {
  const { adminId } = useParams();
  const router = useRouter();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetAdminByIdQuery(adminId);
  const admin = normalizeAdmin(data?.admin);

  if (isLoading) return <GlobalSpinner label="Loading access controls..." />;

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

  const handleSave = () => {
    toast.success(`Access settings saved for ${admin.name}.`);
    router.push(`/user-management/admin/${admin.id}/view`);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <Link href="/user-management/admin" className="back-link">
          <ArrowLeft size={14} />
          Back to admins
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Access control
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Choose which admin panel menus {admin.name} can access.
        </p>
      </div>

      <section className="surface-card p-5">
        <AdminAccessControlForm
          admin={admin}
          onSave={handleSave}
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
