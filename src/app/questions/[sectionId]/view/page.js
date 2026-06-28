"use client";

import { useGetExamByIdQuery } from "@/features/exams/exam/api/examApi";
import { useGetSectionByIdQuery } from "@/features/exams/sections/api/sectionApi";
import { SectionNotFound } from "@/features/exams/sections/SectionNotFound";
import {
  formatSectionDate,
  getSectionExamId,
} from "@/lib/sectionData";
import { ArrowLeft, Layers3 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default function ViewSectionPage() {
  const { sectionId } = useParams();
  const {
    data,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useGetSectionByIdQuery(sectionId, {
    skip: !sectionId,
  });
  const section = data?.section || data || null;
  const examID = getSectionExamId(section);
  const { data: examData } = useGetExamByIdQuery(examID, {
    skip: !examID || Boolean(section?.exam),
  });

  if (isLoading || isFetching) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-56 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <Link href="/questions" className="back-link">
          <ArrowLeft size={14} />
          Back to questions
        </Link>
        <section className="surface-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Unable to load question
          </h1>
          <p className="mt-2 text-sm text-muted">
            The question details could not be loaded.
          </p>
          <button
            type="button"
            className="button button-secondary mt-5"
            onClick={refetch}
          >
            Retry
          </button>
        </section>
      </div>
    );
  }

  if (!section) return <SectionNotFound />;

  const exam = section.exam || examData?.exam || examData;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <Link href="/questions" className="back-link">
          <ArrowLeft size={14} />
          Back to questions
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Question details
        </h1>
        <p className="mt-2 text-sm text-muted">
          View the selected question and its assigned exam.
        </p>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border bg-surface-muted px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                <Layers3 size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  {section.name}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted">
                  ID: {section.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <dl>
            <DetailRow label="Name" value={section.name} />
            <DetailRow label="Exam" value={exam?.name || "Unknown exam"} />
            <DetailRow label="Exam ID" value={examID} />
            <DetailRow label="Max papers" value={section.maxPapers} />
            <DetailRow
              label="Created"
              value={formatSectionDate(section.createdAt)}
            />
            <DetailRow
              label="Updated"
              value={formatSectionDate(section.updatedAt)}
            />
            <DetailRow
              label="Duration"
              value={
                exam?.durationIntMinutes
                  ? `${exam.durationIntMinutes} minutes`
                  : "Not provided"
              }
            />
            <DetailRow label="Pass mark" value={exam?.passMark} />
            <DetailRow
              label="Published"
              value={
                exam
                  ? `${exam.publishedDate || "No date"} ${
                      exam.publishedTime || ""
                    }`.trim()
                  : "Not provided"
              }
            />
            <DetailRow
              label="Expires"
              value={
                exam
                  ? `${exam.expiredDate || "No date"} ${
                      exam.expiredTime || ""
                    }`.trim()
                  : "Not provided"
              }
            />
          </dl>
        </div>
      </section>
    </div>
  );
}
