"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { ExamForm } from "@/features/exams/ExamForm";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { useExamManagement } from "@/hooks/useExamManagement";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildCategoryOptions(childrenMap) {
  const options = [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((category) => {
      const path = [...parentPath, category.name];
      options.push({
        label: category.name,
        value: category.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(category.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

export function ExamFormPage({
  examId,
  initialCategories,
  initialExams,
  initialPackages = [],
  initialSubjects,
  initialTopics,
  mode = "create",
}) {
  const router = useRouter();
  const { categoryIndex } = useCategoryManagement(initialCategories);
  const { createExam, getExamById, updateExam } =
    useExamManagement(initialExams);
  const { subjectIndex, topics } = useSubjectManagement(
    initialSubjects,
    initialTopics,
  );
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categoryIndex.childrenMap),
    [categoryIndex.childrenMap],
  );
  const packageOptions = useMemo(
    () => [
      { label: "No package", value: "" },
      ...initialPackages.map((packageInfo) => ({
        label: packageInfo.title,
        value: packageInfo.id,
        meta: packageInfo.status,
        searchText: `${packageInfo.title} ${packageInfo.status} ${packageInfo.packageType}`,
      })),
    ],
    [initialPackages],
  );
  const exam = mode === "edit" ? getExamById(examId) : null;
  const isLoadedForEdit = mode !== "edit" || Boolean(exam);

  const handleSubmit = (examInput) => {
    if (mode === "edit" && exam) {
      const updatedExam = updateExam(exam.id, examInput);
      if (updatedExam) {
        toast.success(`${updatedExam.name} updated.`);
        router.push("/exams");
      }
      return;
    }

    const createdExam = createExam(examInput);
    toast.success(`${createdExam.name} created.`);
    router.push("/exams");
  };

  if (!isLoadedForEdit) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <Link href="/exams" className="back-link">
          <ArrowLeft size={16} />
          Back to exams
        </Link>
        <section className="surface-card p-8 text-center">
          <p className="font-semibold text-foreground">Exam not found</p>
          <p className="mt-1 text-sm text-muted">
            The selected exam is not available in the current list.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <Link href="/exams" className="back-link">
          <ArrowLeft size={16} />
          Back to exams
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm font-semibold text-brand-strong">
            {mode === "edit" ? "Update exam" : "New exam"}
          </p>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {mode === "edit" ? "Edit exam" : "Create exam"}
          </h1>
        </div>
      </div>

      <ExamForm
        categoryIndex={categoryIndex}
        categoryOptions={categoryOptions}
        exam={exam}
        onSubmit={handleSubmit}
        packageOptions={packageOptions}
        submitLabel={mode === "edit" ? "Save changes" : "Create exam"}
        subjectIndex={subjectIndex}
        topics={topics}
        secondaryAction={
          <Link href="/exams" className="button button-secondary">
            Cancel
          </Link>
        }
      />
    </div>
  );
}
