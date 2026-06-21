"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { useAdminManagement } from "@/hooks/useAdminManagement";

export default function EditAdminPage() {
  const { adminId } = useParams();
  const router = useRouter();
  const { getAdminById, isLoaded, updateAdmin } = useAdminManagement();
  const admin = getAdminById(adminId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="surface-card h-96 animate-pulse" />
      </div>
    );
  }

  if (!admin) return <AdminNotFound />;

  const handleSubmit = (adminInput) => {
    const updatedAdmin = updateAdmin(admin.id, adminInput);
    toast.success(`${updatedAdmin.name} updated.`);
    router.push(`/user-management/admin/${admin.id}/view`);
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
        <AdminForm
          admin={admin}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
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
