"use client";

import { ExamTypeForm } from "@/features/exam-types/ExamTypeForm";
import { ExamTypeNotFound } from "@/features/exam-types/ExamTypeNotFound";
import { useExamTypeManagement } from "@/hooks/useExamTypeManagement";
import { DEFAULT_EXAM_TYPES_RESPONSE } from "@/lib/examTypeData";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditExamTypePage() {
  const { examTypeId } = useParams();
  const router = useRouter();
  const { getExamTypeById, isLoaded, updateExamType } =
    useExamTypeManagement(DEFAULT_EXAM_TYPES_RESPONSE.examTypes);
  const examType = getExamTypeById(examTypeId);

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="surface-card h-80 animate-pulse" />
      </div>
    );
  }

  if (!examType) return <ExamTypeNotFound />;

  const handleSubmit = (examTypeInput) => {
    const updatedExamType = updateExamType(examType.id, examTypeInput);
    toast.success(`${updatedExamType.name} updated.`);
    router.push(`/exam-types/${examType.id}/view`);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/exam-types" className="back-link">
          <ArrowLeft size={14} />
          Back to exam types
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Edit exam type
        </h1>
        <p className="mt-2 text-sm text-muted">
          Update details for {examType.name}.
        </p>
      </div>

      <section className="surface-card p-5">
        <ExamTypeForm
          examType={examType}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          secondaryAction={
            <Link
              href={`/exam-types/${examType.id}/view`}
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
