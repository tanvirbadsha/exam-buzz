"use client";

import { StudentNotFound } from "@/features/users/student/StudentNotFound";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import { formatStudentCurrency } from "@/lib/studentData";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function MetricCard({ action, label, value }) {
  return (
    <article className="rounded-lg border border-border bg-surface-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
        </div>
        {action}
      </div>
    </article>
  );
}

export default function ViewStudentPage() {
  const { studentId } = useParams();
  const { getStudentById, isLoaded } = useStudentManagement();
  const student = getStudentById(studentId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-56 animate-pulse" />
      </div>
    );
  }

  if (!student) return <StudentNotFound />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/user-management/students" className="back-link">
            <ArrowLeft size={14} />
            Back to students
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Student details
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review account identity, purchase summary, and exam activity.
          </p>
        </div>
        <Link
          href={`/user-management/students/${student.id}/edit`}
          className="button button-primary"
        >
          <Pencil size={16} />
          Edit student
        </Link>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {student.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-muted">
                {student.userId} / {student.registrationId}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                student.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {student.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <dl>
            <DetailRow label="Phone" value={student.phone} />
            <DetailRow label="Email" value={student.email || "Not provided"} />
            <DetailRow
              label="Address"
              value={student.address || "Not provided"}
            />
            <DetailRow
              label="Purchased package"
              value={student.purchasedPackage}
            />
            <DetailRow
              label="Created"
              value={new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(student.createdAt))}
            />
          </dl>

          <aside className="space-y-4">
            <MetricCard
              label="Purchased package"
              value={student.purchasedPackageCount}
            />
            <MetricCard
              label="Purchase amount"
              value={formatStudentCurrency(student.purchaseAmount)}
              action={
                <Link
                  href={`/user-management/students/${student.id}/package-history`}
                  className="icon-button h-9 w-9 border border-border bg-surface"
                  aria-label={`View package history for ${student.name}`}
                >
                  <Eye size={16} />
                </Link>
              }
            />
            <MetricCard
              label="Preliminary exam"
              value={student.preliminaryExam}
            />
            <MetricCard label="Written exam" value={student.writtenExam} />
          </aside>
        </div>
      </section>
    </div>
  );
}
