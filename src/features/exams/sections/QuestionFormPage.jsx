"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { TextInput } from "@/components/ui/forms/TextInput";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import {
  useGetAllExamsQuery,
  useGetExamByIdQuery,
} from "@/features/exams/exam/api/examApi";
import { useCreateSectionMutation } from "@/features/exams/sections/api/sectionApi";
import { BookOpenCheck, FileText, Hash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const EXAM_OPTIONS_LIMIT = 1000;

const emptyForm = {
  examID: "",
  name: "",
  maxPapers: "",
};

function getExamName(exam) {
  return exam?.name || "Unknown exam";
}

function getExamsFromResponse(response) {
  return Array.isArray(response?.exams) ? response.exams : [];
}

function getExamFromResponse(response) {
  return response?.exam || response || null;
}

function normalizeApiId(value) {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}

function buildExamOptions(exams) {
  return [...exams]
    .sort((firstExam, secondExam) =>
      getExamName(firstExam).localeCompare(getExamName(secondExam)),
    )
    .map((exam) => ({
      label: getExamName(exam),
      value: exam.id,
      depth: 0,
      meta: getExamName(exam),
      searchText: `${getExamName(exam)} ${exam.id} ${exam.category?.name || ""}`,
      exam,
    }));
}

function buildErrors(form, examIds) {
  const errors = {};
  const maxPapers = Number(form.maxPapers);

  if (!form.examID || !examIds.has(String(form.examID))) {
    errors.examID = { message: "Select a valid exam." };
  }

  if (!form.name.trim()) {
    errors.name = { message: "Question name is required." };
  }

  if (!Number.isInteger(maxPapers) || maxPapers < 1) {
    errors.maxPapers = { message: "Max paper count must be at least 1." };
  }

  return errors;
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.data?.message ||
    error?.error ||
    error?.message ||
    fallbackMessage
  );
}

export function QuestionFormPage({ initialExamId = "" }) {
  const router = useRouter();
  const normalizedInitialExamId = initialExamId ? String(initialExamId) : "";
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    examID: normalizedInitialExamId,
  }));
  const [errors, setErrors] = useState({});
  const {
    data: examsData,
    error: examsError,
    isFetching,
    isLoading,
    refetch,
  } = useGetAllExamsQuery({
    page: 1,
    limit: EXAM_OPTIONS_LIMIT,
  });
  const { data: initialExamData } = useGetExamByIdQuery(
    normalizedInitialExamId,
    {
      skip: !normalizedInitialExamId,
    },
  );
  const [createSection, { isLoading: isCreating }] =
    useCreateSectionMutation();

  const exams = useMemo(() => {
    const listExams = getExamsFromResponse(examsData);
    const routeExam = getExamFromResponse(initialExamData);

    if (
      !routeExam?.id ||
      listExams.some((exam) => String(exam.id) === String(routeExam.id))
    ) {
      return listExams;
    }

    return [routeExam, ...listExams];
  }, [examsData, initialExamData]);
  const examOptions = useMemo(() => buildExamOptions(exams), [exams]);
  const examIds = useMemo(
    () => new Set(examOptions.map((option) => String(option.value))),
    [examOptions],
  );
  const selectedExam = useMemo(
    () =>
      examOptions.find(
        (option) => String(option.value) === String(form.examID),
      ),
    [examOptions, form.examID],
  );

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form, examIds);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      examID: normalizeApiId(form.examID),
      name: form.name.trim(),
      maxPapers: Number(form.maxPapers),
    };

    try {
      const response = await createSection(payload).unwrap();
      toast.success(`${response?.section?.name || payload.name} created.`);
      router.push("/questions");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Question could not be created."));
    }
  };

  if (isLoading && exams.length === 0) {
    return <GlobalSpinner label="Loading exams..." />;
  }

  if (examsError && exams.length === 0) {
    return (
      <ErrorCard
        title="Unable to load exams"
        message={getApiErrorMessage(
          examsError,
          "Exam options could not be loaded.",
        )}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href="/questions" className="back-link">
          <ArrowLeft size={14} />
          Back to questions
        </Link>
        <p className="mt-4 text-sm font-semibold text-brand-strong">
          Exam management
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
          Create Question
        </h1>
        {selectedExam && (
          <p className="mt-2 text-sm text-muted">
            Exam preselected: {selectedExam.label}
          </p>
        )}
      </div>

      <section className="surface-card p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <HierarchicalCategoryDropdown
            label="Exam"
            icon={BookOpenCheck}
            options={examOptions}
            value={form.examID}
            onChange={(option) => updateField("examID", option.value)}
            placeholder={isFetching ? "Loading exams..." : "Select exam"}
            searchPlaceholder="Search exams..."
            emptyText="No exams found."
            error={errors.examID}
          />

          <TextInput
            label="Question name"
            name="question-name"
            icon={FileText}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={errors.name}
            placeholder="Paper Question A"
          />

          <TextInput
            label="Max paper count"
            name="question-max-papers"
            icon={Hash}
            type="number"
            min="1"
            step="1"
            value={form.maxPapers}
            onChange={(event) => updateField("maxPapers", event.target.value)}
            error={errors.maxPapers}
            placeholder="3"
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Link href="/questions" className="button button-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="button button-primary"
              disabled={isCreating || examOptions.length === 0}
            >
              {isCreating ? "Creating..." : "Create Question"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
