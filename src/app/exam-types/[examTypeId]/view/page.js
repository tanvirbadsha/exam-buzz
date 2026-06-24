"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { ExamTypeNotFound } from "@/features/exams/exam-types/ExamTypeNotFound";
import { useGetExamTypeByIdQuery } from "@/features/exams/exam-types/api/examTypes";
import {
  getExamTypeApiErrorMessage,
  normalizeExamType,
} from "@/features/exams/exam-types/examTypeUtils";
import {
  formatExamTypeDate,
  isExamTypeIconImage,
} from "@/lib/examTypeData";
import { ArrowLeft, Layers3, Pencil } from "lucide-react";
import Image from "next/image";
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

export default function ViewExamTypePage() {
  const { examTypeId } = useParams();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetExamTypeByIdQuery(examTypeId, {
    skip: !examTypeId,
  });
  const examType = normalizeExamType(data?.examType);

  if (isLoading) {
    return <GlobalSpinner label="Loading exam type..." />;
  }

  if (error && !examType) {
    return (
      <ErrorCard
        title="Unable to load exam type"
        message={getExamTypeApiErrorMessage(
          error,
          "The exam type could not be loaded.",
        )}
        onRetry={refetch}
      />
    );
  }

  if (!examType) return <ExamTypeNotFound />;

  const detailResponse = {
    status: data?.status || 200,
    message: data?.message || "Exam type retrieved successfully",
    examType,
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/exam-types" className="back-link">
            <ArrowLeft size={14} />
            Back to exam types
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Exam type details
          </h1>
          <p className="mt-2 text-sm text-muted">{detailResponse.message}</p>
        </div>
        <Link
          href={`/exam-types/${examType.id}/edit`}
          className="button button-primary"
        >
          <Pencil size={16} />
          Edit exam type
        </Link>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft px-2 text-sm font-black text-brand-strong">
                {isExamTypeIconImage(examType.icon) ? (
                  <Image
                    src={examType.icon}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  examType.icon || <Layers3 size={20} />
                )}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  {examType.name}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted">
                  ID: {examType.id}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {detailResponse.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <dl>
            <DetailRow label="Name" value={examType.name} />
            <DetailRow label="Icon" value={examType.icon || "Not provided"} />
            <DetailRow
              label="Created"
              value={formatExamTypeDate(examType.createdAt)}
            />
            <DetailRow
              label="Updated"
              value={formatExamTypeDate(examType.updatedAt)}
            />
          </dl>

          <aside className="rounded-lg border border-border bg-surface-muted p-4">
            <h3 className="text-sm font-bold text-foreground">
              Response preview
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Status
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {detailResponse.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Message
                </dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {detailResponse.message}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}
