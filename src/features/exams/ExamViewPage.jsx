"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { categoryApi } from "@/features/categories/api/categoryApi";
import { useGetExamByIdQuery } from "@/features/exams/exam/api/examApi";
import {
  getExamApiErrorMessage,
  getExamFromResponse,
  getLookupItemsFromResponse,
  normalizeExam,
  normalizeExamCategories,
  normalizeExamSubjects,
  normalizeExamTopics,
} from "@/features/exams/exam/examUtils";
import { subjectsApi } from "@/features/subjects/api/subjectsApi";
import { topicsApi } from "@/features/topics/api/topicsApi";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  formatExamTimeline,
  getExamCategoryId,
  getExamPdfLabel,
} from "@/lib/examData";

const LOOKUP_LIMIT = 1000;
const INITIAL_LOOKUP_QUERY_ARGS = {
  page: 1,
  limit: LOOKUP_LIMIT,
};

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
  return {
    [mapKey]: new Map(items.map((item) => [item.id, item])),
    childrenMap: buildChildrenMap(items),
  };
}

function getPath(itemsById, itemId) {
  const path = [];
  const visitedIds = new Set();
  let item = itemsById.get(itemId);

  while (item && !visitedIds.has(item.id)) {
    path.unshift(item);
    visitedIds.add(item.id);
    item = item.parentId ? itemsById.get(item.parentId) : null;
  }

  return path;
}

function getNamesByIds(ids, itemsById, fallbackPrefix) {
  return ids.map((id) => itemsById.get(id)?.name || `${fallbackPrefix} ${id}`);
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function PdfDetailLink({ href, label }) {
  if (!href) return <DetailItem label={label} value="Not uploaded" />;

  return (
    <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex max-w-full items-start gap-2 break-all text-sm font-bold text-brand-strong hover:underline"
      >
        <Download size={16} className="mt-0.5 shrink-0" />
        Open PDF
      </a>
    </div>
  );
}

export function ExamViewPage({
  examId,
  initialCategoriesData,
  initialPackages = [],
  initialSubjectsData,
  initialTopicsData,
}) {
  const dispatch = useDispatch();
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
    data: examData,
    error: examError,
    isUninitialized: isExamUninitialized,
    isLoading: isLoadingExam,
    isFetching: isFetchingExam,
    refetch: refetchExam,
  } = useGetExamByIdQuery(examId, {
    skip: !examId,
  });
  const { data: queryCategoriesData } =
    categoryApi.useGetAllCategoriesQuery(INITIAL_LOOKUP_QUERY_ARGS, {
      skip: shouldUseInitialLookupData && !initialCategoriesData?._error,
      placeholderData:
        shouldUseInitialLookupData && !initialCategoriesData?._error
          ? initialCategoriesData
          : undefined,
    });
  const { data: querySubjectsData } =
    subjectsApi.useGetAllSubjectQuery(INITIAL_LOOKUP_QUERY_ARGS, {
      skip: shouldUseInitialLookupData && !initialSubjectsData?._error,
      placeholderData:
        shouldUseInitialLookupData && !initialSubjectsData?._error
          ? initialSubjectsData
          : undefined,
    });
  const { data: queryTopicsData } =
    topicsApi.useGetAllTopicsQuery(INITIAL_LOOKUP_QUERY_ARGS, {
      skip: shouldUseInitialLookupData && !initialTopicsData?._error,
      placeholderData:
        shouldUseInitialLookupData && !initialTopicsData?._error
          ? initialTopicsData
          : undefined,
    });

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
  const exam = normalizeExam(getExamFromResponse(examData));
  const categories = useMemo(
    () =>
      normalizeExamCategories(
        getLookupItemsFromResponse(categoriesData, "categories"),
      ),
    [categoriesData],
  );
  const subjects = useMemo(
    () =>
      normalizeExamSubjects(getLookupItemsFromResponse(subjectsData, "subjects")),
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
  const packageById = useMemo(
    () =>
      new Map(
        initialPackages.map((packageInfo) => [String(packageInfo.id), packageInfo]),
      ),
    [initialPackages],
  );
  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  if ((isExamUninitialized || isLoadingExam || isFetchingExam) && !exam) {
    return <GlobalSpinner label="Loading exam details..." />;
  }

  if (examError && !exam) {
    return (
      <ErrorCard
        title="Unable to load exam"
        message={getExamApiErrorMessage(
          examError,
          "The selected exam could not be loaded.",
        )}
        onRetry={refetchExam}
      />
    );
  }

  if (!exam) {
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

  const categoryPath = getPath(
    categoryIndex.categoriesById,
    getExamCategoryId(exam),
  );
  const categoryName =
    categoryPath.map((category) => category.name).join(" / ") ||
    exam.category?.name ||
    "Unknown category";
  const subjectNames = getNamesByIds(
    (exam.subjectIds || []).map((id) => String(id)),
    subjectIndex.subjectsById,
    "Subject",
  );
  const topicNames = getNamesByIds(
    (exam.topicIds || []).map((id) => String(id)),
    topicsById,
    "Topic",
  );
  const timeline = formatExamTimeline(exam);
  const packageInfo = exam.packageId ? packageById.get(exam.packageId) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/exams" className="back-link">
            <ArrowLeft size={16} />
            Back to exams
          </Link>
          <p className="mt-5 text-sm font-semibold text-brand-strong">
            Exam details
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            {exam.name}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">ID: {exam.id}</p>
        </div>

        <Link href={`/exams/${exam.id}/edit`} className="button button-primary">
          <Pencil size={16} />
          Edit exam
        </Link>
      </div>

      <section className="surface-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Category" value={categoryName} />
          <DetailItem
            label="Package"
            value={packageInfo?.title || "No package selected"}
          />
          <DetailItem label="Status" value={exam.status ? "Active" : "Inactive"} />
          <DetailItem label="Subjects" value={subjectNames.join(", ")} />
          <DetailItem label="Topics" value={topicNames.join(", ")} />
          <DetailItem
            label="Duration"
            value={`${exam.durationIntMinutes} minutes`}
          />
          <DetailItem label="Pass mark" value={exam.passMark} />
          <DetailItem label="Publish timeline" value={timeline.publish} />
          <DetailItem label="Expire timeline" value={timeline.expire} />
          <PdfDetailLink
            href={exam.questionPDF}
            label={getExamPdfLabel(exam.questionPDFName, "Question PDF")}
          />
          <PdfDetailLink
            href={exam.demoAnswerPDF}
            label={getExamPdfLabel(exam.demoAnswerPDFName, "Demo Answer PDF")}
          />
        </div>
      </section>
    </div>
  );
}
