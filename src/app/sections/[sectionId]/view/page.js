"use client";

import { StatusToggle } from "@/components/ui/StatusToggle";
import { SectionNotFound } from "@/features/sections/SectionNotFound";
import { useExamManagement } from "@/hooks/useExamManagement";
import { useSectionManagement } from "@/hooks/useSectionManagement";
import { DEFAULT_EXAMS } from "@/lib/examData";
import {
  DEFAULT_SECTIONS_RESPONSE,
  formatSectionDate,
  getSectionExamId,
  getSectionStatus,
} from "@/lib/sectionData";
import { ArrowLeft, BookOpenCheck, Layers3 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

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
  const { exams, getExamById } = useExamManagement(DEFAULT_EXAMS);
  const { getSectionById, isLoaded, updateSectionStatus } =
    useSectionManagement(DEFAULT_SECTIONS_RESPONSE.sections, exams);
  const section = getSectionById(sectionId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="surface-card h-56 animate-pulse" />
      </div>
    );
  }

  if (!section) return <SectionNotFound />;

  const examID = getSectionExamId(section);
  const exam = section.exam || getExamById(examID);
  const isActive = getSectionStatus(section);
  const responsePreview = {
    status: 200,
    message: "Section retrieved successfully",
    section: {
      ...section,
      status: isActive,
      exam,
    },
  };

  const handleStatusChange = (checked) => {
    const updatedSection = updateSectionStatus(section.id, checked);
    if (updatedSection) {
      toast.success(
        `${updatedSection.name} marked ${checked ? "active" : "inactive"}.`,
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <Link href="/sections" className="back-link">
          <ArrowLeft size={14} />
          Back to sections
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Section details
        </h1>
        <p className="mt-2 text-sm text-muted">
          View the selected section and its assigned exam.
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
            <div className="flex items-center gap-3">
              <StatusToggle
                checked={isActive}
                label={`Set ${section.name} active status`}
                onChange={handleStatusChange}
              />
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <dl>
            <DetailRow label="Name" value={section.name} />
            <DetailRow label="Exam" value={exam?.name || "Unknown exam"} />
            <DetailRow label="Exam ID" value={examID} />
            <DetailRow label="Max papers" value={section.maxPapers} />
            <DetailRow label="Status" value={isActive ? "Active" : "Inactive"} />
            <DetailRow label="Created" value={formatSectionDate(section.createdAt)} />
            <DetailRow label="Updated" value={formatSectionDate(section.updatedAt)} />
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

          <aside className="rounded-lg border border-border bg-surface-muted p-4">
            <div className="flex items-center gap-2">
              <BookOpenCheck size={16} className="text-brand-strong" />
              <h3 className="text-sm font-bold text-foreground">
                Response preview
              </h3>
            </div>
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-surface p-3 text-xs leading-5 text-foreground">
              {JSON.stringify(responsePreview, null, 2)}
            </pre>
          </aside>
        </div>
      </section>
    </div>
  );
}
