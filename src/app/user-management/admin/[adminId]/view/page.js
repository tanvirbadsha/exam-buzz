"use client";

import { ArrowLeft, KeyRound, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { useAdminManagement } from "@/hooks/useAdminManagement";
import { ADMIN_MENU_OPTIONS, getRoleLabel } from "@/lib/adminData";

function AdminDetailRow({ label, value }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default function ViewAdminPage() {
  const { adminId } = useParams();
  const { getAdminById, isLoaded } = useAdminManagement();
  const admin = getAdminById(adminId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-56 animate-pulse" />
      </div>
    );
  }

  if (!admin) return <AdminNotFound />;

  const accessLabels = ADMIN_MENU_OPTIONS.flatMap((group) => group.items).filter(
    (item) => admin.accessKeys.includes(item.key),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/user-management/admin" className="back-link">
            <ArrowLeft size={14} />
            Back to admins
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Admin details
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review profile information and enabled menu access.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/user-management/admin/${admin.id}/access-control`}
            className="button button-secondary"
          >
            <KeyRound size={16} />
            Access control
          </Link>
          <Link
            href={`/user-management/admin/${admin.id}/edit`}
            className="button button-primary"
          >
            <Pencil size={16} />
            Edit admin
          </Link>
        </div>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border bg-surface-muted px-5 py-5 sm:flex-row sm:items-center">
          <AdminAvatar admin={admin} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">{admin.name}</h2>
            <p className="mt-1 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
              {getRoleLabel(admin.role)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <dl>
            <AdminDetailRow label="Phone" value={admin.phone} />
            <AdminDetailRow label="Email" value={admin.email} />
            <AdminDetailRow label="Address" value={admin.address} />
            <AdminDetailRow
              label="Created"
              value={new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(admin.createdAt))}
            />
          </dl>

          <aside className="rounded-lg border border-border bg-surface-muted p-4">
            <h3 className="text-sm font-bold text-foreground">Menu access</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {accessLabels.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
