"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { ExamTypeForm } from "@/features/exams/exam-types/ExamTypeForm";
import { ExamTypeNotFound } from "@/features/exams/exam-types/ExamTypeNotFound";
import {
  useGetExamTypeByIdQuery,
  useUpdateExamTypeMutation,
} from "@/features/exams/exam-types/api/examTypes";
import {
  buildExamTypeUpdateFormData,
  getExamTypeApiErrorMessage,
  hasFormDataEntries,
  normalizeExamType,
} from "@/features/exams/exam-types/examTypeUtils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditExamTypePage() {
  const { examTypeId } = useParams();
  const router = useRouter();
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetExamTypeByIdQuery(examTypeId, {
    skip: !examTypeId,
  });
  const [updateExamType, { isLoading: isUpdating }] =
    useUpdateExamTypeMutation();
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

  const handleSubmit = async (examTypeInput) => {
    const body = buildExamTypeUpdateFormData(examTypeInput, examType);

    if (!hasFormDataEntries(body)) {
      toast.error("No changes to save.");
      return;
    }

    try {
      const response = await updateExamType({ id: examType.id, body }).unwrap();
      toast.success(`${response?.examType?.name || examTypeInput.name} updated.`);
      router.push(`/exam-types/${examType.id}/view`);
    } catch (updateError) {
      toast.error(
        getExamTypeApiErrorMessage(updateError, "Failed to update exam type."),
      );
    }
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
          isSubmitting={isUpdating}
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
