import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export function AdminNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-lg border border-border bg-surface px-6 py-16 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-danger">
        <ShieldX size={24} />
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">
        Admin not found
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        This admin record does not exist or was removed from the local admin
        list.
      </p>
      <Link href="/user-management/admin" className="button button-primary mt-6">
        <ArrowLeft size={16} />
        Back to admins
      </Link>
    </div>
  );
}
