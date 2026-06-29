"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { categoryApi } from "@/features/categories/api/categoryApi";
import { ExamForm } from "@/features/exams/ExamForm";
import {
  useCreateExamMutation,
  useGetExamByIdQuery,
  useUpdateExamMutation,
} from "@/features/exams/exam/api/examApi";
import {
  buildExamCreateBody,
  buildExamUpdateBody,
  getExamApiErrorMessage,
  getExamFromResponse,
  getLookupItemsFromResponse,
  hasObjectEntries,
  normalizeExam,
  normalizeExamCategories,
  normalizeExamSubjects,
  normalizeExamTopics,
} from "@/features/exams/exam/examUtils";
import {
  QuickCreateMenu,
  QuickCreateMenuItem,
} from "@/features/exams/ui/QuickCreateMenu";
import { subjectsApi } from "@/features/subjects/api/subjectsApi";
import { topicsApi } from "@/features/topics/api/topicsApi";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const LOOKUP_LIMIT = 1000;
const INITIAL_LOOKUP_QUERY_ARGS = {
  page: 1,
  limit: LOOKUP_LIMIT,
};

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildChildrenMap(items) {
  const itemIds = new Set(items.map((item) => item.id));
  const childrenMap = new Map();

  items.forEach((item) => {
    const parentKey =
      item.parentId && itemIds.has(item.parentId) ? item.parentId : "root";
    const children = childrenMap.get(parentKey) || [];
    children.push(item);
    childrenMap.set(parentKey, children);
  });

  return childrenMap;
}

function buildEntityIndex(items, mapKey) {
  const itemsById = new Map();

  items.forEach((item) => {
    if (!item?.id || itemsById.has(String(item.id))) return;
    itemsById.set(String(item.id), item);
  });

  const uniqueItems = Array.from(itemsById.values());

  return {
    [mapKey]: new Map(uniqueItems.map((item) => [item.id, item])),
    childrenMap: buildChildrenMap(uniqueItems),
  };
}

function uniqueOptionsByValue(options) {
  const seenValues = new Set();

  return options.filter((option) => {
    const value = String(option.value ?? "");
    if (!value || seenValues.has(value)) return false;
    seenValues.add(value);
    return true;
  });
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
  return uniqueOptionsByValue(options);
}

export function ExamFormPage({
  examId,
  initialCategoriesData,
  initialPackages = [],
  initialSubjectsData,
  initialTopicsData,
  mode = "create",
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isEditMode = mode === "edit";
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () =>
      !initialCategoriesData ||
      !initialSubjectsData ||
      !initialTopicsData ||
      Boolean(
        initialCategoriesData?._error ||
        initialSubjectsData?._error ||
        initialTopicsData?._error,
      ),
  );

  useEffect(() => {
    if (!initialCategoriesData || !initialSubjectsData || !initialTopicsData) {
      return;
    }

    if (!initialCategoriesData._error) {
      dispatch(
        categoryApi.util.upsertQueryData(
          "getAllCategories",
          INITIAL_LOOKUP_QUERY_ARGS,
          initialCategoriesData,
        ),
      );
    }

    if (!initialSubjectsData._error) {
      dispatch(
        subjectsApi.util.upsertQueryData(
          "getAllSubject",
          INITIAL_LOOKUP_QUERY_ARGS,
          initialSubjectsData,
        ),
      );
    }

    if (!initialTopicsData._error) {
      dispatch(
        topicsApi.util.upsertQueryData(
          "getAllTopics",
          INITIAL_LOOKUP_QUERY_ARGS,
          initialTopicsData,
        ),
      );
    }

    queueMicrotask(() => setHasHydratedInitialData(true));
  }, [dispatch, initialCategoriesData, initialSubjectsData, initialTopicsData]);

  const shouldUseInitialLookupData =
    !hasHydratedInitialData &&
    Boolean(initialCategoriesData && initialSubjectsData && initialTopicsData);

  const {
    data: queryCategoriesData,
    error: categoriesError,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = categoryApi.useGetAllCategoriesQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialLookupData && !initialCategoriesData?._error,
    placeholderData:
      shouldUseInitialLookupData && !initialCategoriesData?._error
        ? initialCategoriesData
        : undefined,
  });
  const {
    data: querySubjectsData,
    error: subjectsError,
    isLoading: isLoadingSubjects,
    refetch: refetchSubjects,
  } = subjectsApi.useGetAllSubjectQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialLookupData && !initialSubjectsData?._error,
    placeholderData:
      shouldUseInitialLookupData && !initialSubjectsData?._error
        ? initialSubjectsData
        : undefined,
  });
  const {
    data: queryTopicsData,
    error: topicsError,
    isLoading: isLoadingTopics,
    refetch: refetchTopics,
  } = topicsApi.useGetAllTopicsQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialLookupData && !initialTopicsData?._error,
    placeholderData:
      shouldUseInitialLookupData && !initialTopicsData?._error
        ? initialTopicsData
        : undefined,
  });
  const {
    data: examData,
    error: examError,
    isLoading: isLoadingExam,
    refetch: refetchExam,
  } = useGetExamByIdQuery(examId, {
    skip: !isEditMode || !examId,
  });
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [updateExam, { isLoading: isUpdating }] = useUpdateExamMutation();

  const categoriesData =
    shouldUseInitialLookupData && !initialCategoriesData?._error
      ? initialCategoriesData
      : queryCategoriesData;
  const subjectsData =
    shouldUseInitialLookupData && !initialSubjectsData?._error
      ? initialSubjectsData
      : querySubjectsData;
  const topicsData =
    shouldUseInitialLookupData && !initialTopicsData?._error
      ? initialTopicsData
      : queryTopicsData;

  const categories = useMemo(
    () =>
      normalizeExamCategories(
        getLookupItemsFromResponse(categoriesData, "categories"),
      ),
    [categoriesData],
  );
  const subjects = useMemo(
    () =>
      normalizeExamSubjects(
        getLookupItemsFromResponse(subjectsData, "subjects"),
      ),
    [subjectsData],
  );
  const topics = useMemo(
    () => normalizeExamTopics(getLookupItemsFromResponse(topicsData, "topics")),
    [topicsData],
  );
  const categoryIndex = useMemo(
    () => buildEntityIndex(categories, "categoriesById"),
    [categories],
  );
  const subjectIndex = useMemo(
    () => buildEntityIndex(subjects, "subjectsById"),
    [subjects],
  );
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categoryIndex.childrenMap),
    [categoryIndex.childrenMap],
  );
  const packageOptions = useMemo(() => {
    const staticOptions = [
      { label: "No package", value: "__no_package__" },
      ...initialPackages.map((packageInfo, index) => ({
        label: packageInfo.title,
        value: packageInfo.id ?? `package-${index}`,
        meta: packageInfo.status,
        searchText: `${packageInfo.title} ${packageInfo.status} ${packageInfo.packageType}`,
      })),
    ];

    return uniqueOptionsByValue(staticOptions);
  }, [initialPackages]);
  const exam = isEditMode ? normalizeExam(getExamFromResponse(examData)) : null;

  const handleSubmit = async (examInput) => {
    if (isEditMode && exam) {
      const body = buildExamUpdateBody(examInput, exam);

      if (!hasObjectEntries(body)) {
        toast.success("No exam changes to save.");
        return;
      }

      try {
        const response = await updateExam({ id: exam.id, body }).unwrap();
        const updatedExam =
          normalizeExam(getExamFromResponse(response)) || exam;
        toast.success(`${updatedExam.name} updated.`);
        router.push("/exams");
      } catch (updateError) {
        toast.error(
          getExamApiErrorMessage(updateError, "Failed to update exam."),
        );
      }

      return;
    }

    try {
      const response = await createExam(
        buildExamCreateBody(examInput),
      ).unwrap();
      const createdExam =
        normalizeExam(getExamFromResponse(response)) || examInput;
      toast.success(`${createdExam.name} created.`);
      router.push("/exams");
    } catch (createError) {
      toast.error(
        getExamApiErrorMessage(createError, "Failed to create exam."),
      );
    }
  };

  const activeInitialError =
    (!queryCategoriesData &&
      initialCategoriesData?._error &&
      initialCategoriesData) ||
    (!querySubjectsData &&
      initialSubjectsData?._error &&
      initialSubjectsData) ||
    (!queryTopicsData && initialTopicsData?._error && initialTopicsData) ||
    null;
  const activeError =
    categoriesError ||
    subjectsError ||
    topicsError ||
    (isEditMode ? examError : null) ||
    activeInitialError;
  const hasRequiredLookups =
    Boolean(categoriesData && !categoriesData._error) &&
    Boolean(subjectsData && !subjectsData._error) &&
    Boolean(topicsData && !topicsData._error);
  const isLoadingRequiredData =
    isLoadingCategories ||
    isLoadingSubjects ||
    isLoadingTopics ||
    !hasHydratedInitialData ||
    (isEditMode && isLoadingExam);

  const refetchAll = () => {
    refetchCategories();
    refetchSubjects();
    refetchTopics();
    if (isEditMode && examId) {
      refetchExam();
    }
  };

  if (isLoadingRequiredData && (!hasRequiredLookups || (isEditMode && !exam))) {
    return <GlobalSpinner label="Loading exam form..." />;
  }

  if (activeError && (!hasRequiredLookups || (isEditMode && !exam))) {
    return (
      <ErrorCard
        title={isEditMode ? "Unable to load exam" : "Unable to load form data"}
        message={getExamApiErrorMessage(
          activeError,
          "The exam form data could not be loaded.",
        )}
        onRetry={refetchAll}
      />
    );
  }

  if (isEditMode && !exam) {
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
        <div className="flex justify-between gap-5 items-center">
          <Link href="/exams" className="back-link">
            <ArrowLeft size={16} />
            Back to exams
          </Link>
          <QuickCreateMenu>
            <QuickCreateMenuItem href="/categories">
              Category
            </QuickCreateMenuItem>
            <QuickCreateMenuItem href="/subjects">Subject</QuickCreateMenuItem>
            <QuickCreateMenuItem href="/topics">Topic</QuickCreateMenuItem>
            <QuickCreateMenuItem href="/package-management/packages">
              Package
            </QuickCreateMenuItem>
          </QuickCreateMenu>
        </div>

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
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
        packageOptions={packageOptions}
        showStatusField={!isEditMode}
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
