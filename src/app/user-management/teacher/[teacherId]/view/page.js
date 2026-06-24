"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { PermissionTags } from "@/features/users/teacher/PermissionTags";
import { useGetTeacherByIdQuery } from "@/features/users/teacher/api/teacherApi";
import { TeacherNotFound } from "@/features/users/teacher/TeacherNotFound";
import {
  getApiErrorMessage,
  normalizeTeacher,
} from "@/features/users/teacher/teacherUtils";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const EMPTY_VALUE = "N/A";

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

function MetricCard({ label, value }) {
  return (
    <article className="rounded-lg border border-border bg-surface-muted p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </article>
  );
}

export default function ViewTeacherPage() {
  const { teacherId } = useParams();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetTeacherByIdQuery(teacherId);
  const teacher = normalizeTeacher(data?.teacher || data);

  if (isLoading) return <GlobalSpinner label="Loading teacher..." />;

  if (error?.status === 404) return <TeacherNotFound />;
  if (error) {
    return (
      <ErrorCard
        title="Unable to load teacher"
        message={getApiErrorMessage(
          error,
          "The teacher profile could not load.",
        )}
        onRetry={refetch}
      />
    );
  }

  if (!teacher) return <TeacherNotFound />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/user-management/teacher" className="back-link">
            <ArrowLeft size={14} />
            Back to teachers
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Teacher details
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review teacher contact, permissions, and paper activity.
          </p>
        </div>
        <Link
          href={`/user-management/teacher/${teacher.id}/edit`}
          className="button button-primary"
        >
          <Pencil size={16} />
          Edit teacher
        </Link>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-5 py-5">
          <h2 className="text-xl font-bold text-foreground">
            {teacher.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">{teacher.email}</p>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <dl>
            <DetailRow label="Phone" value={teacher.phone || EMPTY_VALUE} />
            <DetailRow label="Email" value={teacher.email || EMPTY_VALUE} />
            <DetailRow
              label="Status"
              value={teacher.isActive ? "Active" : "Inactive"}
            />
            <DetailRow
              label="Created"
              value={
                teacher.createdAt
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(teacher.createdAt))
                  : EMPTY_VALUE
              }
            />
          </dl>

          <aside className="space-y-4">
            {teacher.permissions?.length ? (
              <div className="rounded-lg border border-border bg-surface-muted p-4">
                <h3 className="text-sm font-bold text-foreground">
                  Exam permissions
                </h3>
                <div className="mt-3">
                  <PermissionTags permissions={teacher.permissions} />
                </div>
              </div>
            ) : null}
            <MetricCard
              label="Total assign paper"
              value={teacher.totalAssignPaper ?? EMPTY_VALUE}
            />
            <MetricCard
              label="Total submitted paper"
              value={teacher.totalSubmittedPaper ?? EMPTY_VALUE}
            />
          </aside>
        </div>
      </section>
    </div>
  );
}
