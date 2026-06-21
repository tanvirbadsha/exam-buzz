"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AdminAccessControlForm } from "@/components/admin/AdminAccessControlForm";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { useAdminManagement } from "@/hooks/useAdminManagement";

export default function AdminAccessControlPage() {
  const { adminId } = useParams();
  const router = useRouter();
  const { getAdminById, isLoaded, updateAdminAccess } = useAdminManagement();
  const admin = getAdminById(adminId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-96 animate-pulse" />
      </div>
    );
  }

  if (!admin) return <AdminNotFound />;

  const handleSave = (accessKeys) => {
    const updatedAdmin = updateAdminAccess(admin.id, accessKeys);
    toast.success(`Access updated for ${updatedAdmin.name}.`);
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
