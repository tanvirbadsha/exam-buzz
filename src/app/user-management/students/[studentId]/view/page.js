"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { useGetStudentByIdQuery } from "@/features/users/student/api/studentApi";
import { StudentNotFound } from "@/features/users/student/StudentNotFound";
import {
  getApiErrorMessage,
  normalizeStudent,
} from "@/features/users/student/studentUtils";
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

export default function ViewStudentPage() {
  const { studentId } = useParams();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetStudentByIdQuery(studentId);
  const student = normalizeStudent(data?.student || data);

  if (isLoading) return <GlobalSpinner label="Loading student..." />;

  if (error?.status === 404) return <StudentNotFound />;
  if (error) {
    return (
      <ErrorCard
        title="Unable to load student"
        message={getApiErrorMessage(
          error,
          "The student profile could not load.",
        )}
        onRetry={refetch}
      />
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
            Review account identity and contact details.
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
                ID: {student.id}
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

        <dl className="p-5">
          <DetailRow label="Phone" value={student.phone || EMPTY_VALUE} />
          <DetailRow label="Email" value={student.email || EMPTY_VALUE} />
          <DetailRow
            label="Gender"
            value={student.gender || EMPTY_VALUE}
          />
          <DetailRow
            label="Created"
            value={
              student.createdAt
                ? new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(student.createdAt))
                : EMPTY_VALUE
            }
          />
          <DetailRow
            label="Reg ID"
            value={student.registrationId || EMPTY_VALUE}
          />
          <DetailRow
            label="Purchased package"
            value={student.purchasedPackage || EMPTY_VALUE}
          />
          <DetailRow
            label="Purchase amount"
            value={student.purchaseAmount ?? EMPTY_VALUE}
          />
          <DetailRow
            label="Preli exam"
            value={student.preliminaryExam ?? EMPTY_VALUE}
          />
          <DetailRow
            label="Written exam"
            value={student.writtenExam ?? EMPTY_VALUE}
          />
        </dl>
      </section>
    </div>
  );
}
