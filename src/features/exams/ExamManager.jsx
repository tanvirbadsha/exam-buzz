"use client";

import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { categoryApi } from "@/features/categories/api/categoryApi";
import { CreateExamBtn } from "@/features/exams/CreateExamBtn";
import {
  examApi,
  useDeleteExamMutation,
  useGetAllExamsQuery,
  useGetLiveExamsQuery,
  useGetUpcomingExamsQuery,
  useUpdateDemoAnswerPdfMutation,
  useUpdateExamStatusMutation,
  useUpdateQuestionPdfMutation,
} from "@/features/exams/exam/api/examApi";
import {
  getExamApiErrorMessage,
  getExamPagination,
  getExamsFromResponse,
  getLookupItemsFromResponse,
  normalizeExamCategories,
  normalizeExams,
  normalizeExamSubjects,
  normalizeExamTopics,
} from "@/features/exams/exam/examUtils";
import { ExamQaUploadModal } from "@/features/exams/qa-upload/ExamQaUploadModal";
import { subjectsApi } from "@/features/subjects/api/subjectsApi";
import { topicsApi } from "@/features/topics/api/topicsApi";
import {
  ALL_EXAM_CATEGORY_VALUE,
  ALL_EXAM_SUBJECT_VALUE,
  formatExamTimeline,
  getExamCategoryId,
  getExamPdfLabel,
} from "@/lib/examData";
import {
  Download,
  Eye,
  FileQuestion,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Trophy,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const EXAM_LIST_LIMIT = 1000;
const LOOKUP_LIMIT = 1000;
const INITIAL_EXAM_QUERY_ARGS = {
  search: "",
  page: 1,
  limit: EXAM_LIST_LIMIT,
};
const INITIAL_LOOKUP_QUERY_ARGS = {
  page: 1,
  limit: LOOKUP_LIMIT,
};
const ALL_EXAM_TOPIC_VALUE = "__all_exam_topics__";

const EXAM_PAGE_CONFIG = {
  all: {
    title: "All Exams",
    statLabel: "Exams",
    listLabel: "All exam list",
    emptyMessage: "Adjust the filters or create a new exam.",
    queryEndpointName: "getAllExams",
    useQuery: useGetAllExamsQuery,
  },
  written: {
    title: "Written Exams",
    statLabel: "Exams",
    listLabel: "Written exam list",
    emptyMessage: "Adjust the filters or create a new exam.",
    queryEndpointName: "getAllExams",
    useQuery: useGetAllExamsQuery,
  },
  upcoming: {
    title: "Upcoming Exams",
    statLabel: "Upcoming",
    listLabel: "Upcoming exam list",
    emptyMessage: "Adjust the filters or create a new exam.",
    queryEndpointName: "getUpcomingExams",
    useQuery: useGetUpcomingExamsQuery,
  },
  live: {
    title: "Live Exams",
    statLabel: "Live",
    listLabel: "Live exam list",
    emptyMessage: "Adjust the filters or create a new exam.",
    queryEndpointName: "getLiveExams",
    useQuery: useGetLiveExamsQuery,
  },
};

// sort alphabetically
function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildTreeOptions(childrenMap, includeAllOption, allOption) {
  const options = includeAllOption ? [allOption] : [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((item) => {
      const path = [...parentPath, item.name];
      options.push({
        label: item.name,
        value: item.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(item.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

function buildTopicOptions(topics, subjectsById) {
  return [
    {
      label: "All topics",
      value: ALL_EXAM_TOPIC_VALUE,
      depth: 0,
      meta: "All topics",
      searchText: "all topics",
    },
    ...sortByName(topics).map((topic) => {
      const subjectName = subjectsById.get(topic.subjectId)?.name || "";

      return {
        label: topic.name,
        value: topic.id,
        depth: 0,
        meta: subjectName || "No subject",
        searchText: `${topic.name} ${subjectName}`,
      };
    }),
  ];
}

function getDescendantIds(childrenMap, itemId) {
  const descendantIds = new Set();
  const stack = [...(childrenMap.get(itemId) || [])];

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item || descendantIds.has(item.id)) continue;

    descendantIds.add(item.id);
    stack.push(...(childrenMap.get(item.id) || []));
  }

  return descendantIds;
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

function buildEntityIndex(items, countKey) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const childrenMap = buildChildrenMap(items);
  const directChildCounts = new Map();
  const descendantCounts = new Map();
  const index = {
    childrenMap,
    directChildCounts,
    descendantCounts,
  };

  if (countKey) {
    index[countKey] = itemsById;
  } else {
    index.itemsById = itemsById;
  }

  items.forEach((item) => {
    directChildCounts.set(item.id, childrenMap.get(item.id)?.length || 0);
    descendantCounts.set(item.id, getDescendantIds(childrenMap, item.id).size);
  });

  return index;
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

function PdfLink({ href, label }) {
  if (!href) {
    return (
      <span className="text-xs font-semibold text-muted">Not uploaded</span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-start gap-1.5 break-all text-xs font-bold text-brand-strong hover:underline"
    >
      <Download size={14} className="mt-0.5 shrink-0" />
      {label}
    </a>
  );
}

function getExamParticipantCount(exam) {
  const countFields = [
    "participantsCount",
    "participantCount",
    "studentsParticipated",
    "studentParticipated",
    "attendedStudentsCount",
    "attendeeCount",
    "totalAttendees",
    "totalParticipants",
  ];

  for (const field of countFields) {
    const value = exam?.[field];
    if (value !== undefined && value !== null && value !== "") {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : value;
    }
  }

  const studentLists = [
    exam?.participants,
    exam?.students,
    exam?.attendedStudents,
    exam?.studentSubmissions,
  ];
  const studentList = studentLists.find(Array.isArray);

  return studentList ? studentList.length : "N/A";
}

function QaUploadButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-bold text-foreground shadow-sm transition-colors hover:border-brand hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
    >
      <UploadCloud size={13} />
      Upload file
    </button>
  );
}

function ExamActionMenu({ exam, onDelete }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${exam.name}`}
      menuHeight={236}
    >
      {({ closeMenu }) => (
        <>
          <Link
            href={`/exams/${exam.id}/view`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Eye size={15} className="text-muted" />
            View
          </Link>
          <Link
            href={`/exams/${exam.id}/edit`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Pencil size={15} className="text-muted" />
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(exam);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
          <Link
            href={`/exams/${exam.id}/merit-list`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Trophy size={15} className="text-muted" />
            Merit List
          </Link>
          <Link
            href={`/exams/${exam.id}/assign-teacher`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <UserCheck size={15} className="text-muted" />
            Assign Teacher
          </Link>
          <Link
            href={`/exams/${exam.id}/add-question`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <FileQuestion size={15} className="text-muted" />
            Add Questions
          </Link>
        </>
      )}
    </FloatingActionMenu>
  );
}

export function ExamManager({
  examListType = "all",
  initialCategoriesData,
  initialExamsData,
  initialSubjectsData,
  initialTopicsData,
}) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const pageConfig = EXAM_PAGE_CONFIG[examListType] || EXAM_PAGE_CONFIG.all;
  const useExamListQuery = pageConfig.useQuery;
  const searchQuery = searchParams.get("search") || "";
  const categoryFilter =
    searchParams.get("categoryID") || ALL_EXAM_CATEGORY_VALUE;
  const subjectFilter = searchParams.get("subjectID") || ALL_EXAM_SUBJECT_VALUE;
  const topicFilter = searchParams.get("topicID") || ALL_EXAM_TOPIC_VALUE;
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set());
  const [uploadExam, setUploadExam] = useState(null);
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(
    () =>
      !initialExamsData ||
      !initialCategoriesData ||
      !initialSubjectsData ||
      !initialTopicsData ||
      Boolean(
        initialExamsData?._error ||
        initialCategoriesData?._error ||
        initialSubjectsData?._error ||
        initialTopicsData?._error,
      ),
  );

  useEffect(() => {
    if (
      !initialExamsData ||
      !initialCategoriesData ||
      !initialSubjectsData ||
      !initialTopicsData
    ) {
      return;
    }

    if (!initialExamsData._error) {
      dispatch(
        examApi.util.upsertQueryData(
          pageConfig.queryEndpointName,
          INITIAL_EXAM_QUERY_ARGS,
          initialExamsData,
        ),
      );
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
  }, [
    dispatch,
    initialCategoriesData,
    initialExamsData,
    initialSubjectsData,
    initialTopicsData,
    pageConfig.queryEndpointName,
  ]);

  const shouldUseInitialData =
    !hasHydratedInitialData &&
    Boolean(
      initialExamsData &&
      initialCategoriesData &&
      initialSubjectsData &&
      initialTopicsData,
    );
  const examQueryArgs = useMemo(() => {
    const args = {
      search: searchQuery.trim(),
      page: 1,
      limit: EXAM_LIST_LIMIT,
    };

    if (categoryFilter !== ALL_EXAM_CATEGORY_VALUE) {
      args.categoryID = categoryFilter;
    }

    if (subjectFilter !== ALL_EXAM_SUBJECT_VALUE) {
      args.subjectID = subjectFilter;
    }

    if (topicFilter !== ALL_EXAM_TOPIC_VALUE) {
      args.topicID = topicFilter;
    }

    return args;
  }, [categoryFilter, searchQuery, subjectFilter, topicFilter]);
  const isDefaultExamQuery =
    examQueryArgs.search === INITIAL_EXAM_QUERY_ARGS.search &&
    examQueryArgs.page === INITIAL_EXAM_QUERY_ARGS.page &&
    examQueryArgs.limit === INITIAL_EXAM_QUERY_ARGS.limit &&
    !examQueryArgs.categoryID &&
    !examQueryArgs.subjectID &&
    !examQueryArgs.topicID;
  const canUseInitialExamsData =
    shouldUseInitialData && !initialExamsData?._error && isDefaultExamQuery;

  const {
    data: queryExamsData,
    error: examsError,
    isLoading: isLoadingExams,
    isFetching: isFetchingExams,
    refetch: refetchExams,
  } = useExamListQuery(examQueryArgs, {
    skip: canUseInitialExamsData,
    placeholderData: canUseInitialExamsData ? initialExamsData : undefined,
  });
  const {
    data: queryCategoriesData,
    error: categoriesError,
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = categoryApi.useGetAllCategoriesQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialData && !initialCategoriesData?._error,
    placeholderData:
      shouldUseInitialData && !initialCategoriesData?._error
        ? initialCategoriesData
        : undefined,
  });
  const {
    data: querySubjectsData,
    error: subjectsError,
    isLoading: isLoadingSubjects,
    isFetching: isFetchingSubjects,
    refetch: refetchSubjects,
  } = subjectsApi.useGetAllSubjectQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialData && !initialSubjectsData?._error,
    placeholderData:
      shouldUseInitialData && !initialSubjectsData?._error
        ? initialSubjectsData
        : undefined,
  });
  const {
    data: queryTopicsData,
    error: topicsError,
    isLoading: isLoadingTopics,
    isFetching: isFetchingTopics,
    refetch: refetchTopics,
  } = topicsApi.useGetAllTopicsQuery(INITIAL_LOOKUP_QUERY_ARGS, {
    skip: shouldUseInitialData && !initialTopicsData?._error,
    placeholderData:
      shouldUseInitialData && !initialTopicsData?._error
        ? initialTopicsData
        : undefined,
  });
  const [deleteExam] = useDeleteExamMutation();
  const [updateExamStatus] = useUpdateExamStatusMutation();
  const [updateQuestionPdf, { isLoading: isUpdatingQuestionPdf }] =
    useUpdateQuestionPdfMutation();
  const [updateDemoAnswerPdf, { isLoading: isUpdatingDemoAnswerPdf }] =
    useUpdateDemoAnswerPdfMutation();

  const examsData = canUseInitialExamsData ? initialExamsData : queryExamsData;
  const categoriesData =
    shouldUseInitialData && !initialCategoriesData?._error
      ? initialCategoriesData
      : queryCategoriesData;
  const subjectsData =
    shouldUseInitialData && !initialSubjectsData?._error
      ? initialSubjectsData
      : querySubjectsData;
  const topicsData =
    shouldUseInitialData && !initialTopicsData?._error
      ? initialTopicsData
      : queryTopicsData;

  const exams = useMemo(
    () => normalizeExams(getExamsFromResponse(examsData)),
    [examsData],
  );
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

  const categoryFilterOptions = useMemo(
    () =>
      buildTreeOptions(categoryIndex.childrenMap, true, {
        label: "All categories",
        value: ALL_EXAM_CATEGORY_VALUE,
        depth: 0,
        meta: "All categories",
        searchText: "all categories",
      }),
    [categoryIndex.childrenMap],
  );
  const subjectFilterOptions = useMemo(
    () =>
      buildTreeOptions(subjectIndex.childrenMap, true, {
        label: "All subjects",
        value: ALL_EXAM_SUBJECT_VALUE,
        depth: 0,
        meta: "All subjects",
        searchText: "all subjects",
      }),
    [subjectIndex.childrenMap],
  );
  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );
  const topicFilterOptions = useMemo(
    () => buildTopicOptions(topics, subjectIndex.subjectsById),
    [subjectIndex.subjectsById, topics],
  );
  const pagination = getExamPagination(examsData, exams.length);
  const totals = useMemo(
    () => ({
      total: pagination.total || exams.length,
      active: exams.filter((exam) => exam.status).length,
      inactive: exams.filter((exam) => !exam.status).length,
    }),
    [exams, pagination.total],
  );

  const filteredExams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const categoryIds =
      categoryFilter === ALL_EXAM_CATEGORY_VALUE
        ? null
        : getDescendantIds(categoryIndex.childrenMap, categoryFilter);
    const subjectIds =
      subjectFilter === ALL_EXAM_SUBJECT_VALUE
        ? null
        : getDescendantIds(subjectIndex.childrenMap, subjectFilter);
    const selectedTopicId =
      topicFilter === ALL_EXAM_TOPIC_VALUE ? null : String(topicFilter);

    if (categoryIds) categoryIds.add(categoryFilter);
    if (subjectIds) subjectIds.add(subjectFilter);

    return exams.filter((exam) => {
      const examCategoryId = getExamCategoryId(exam);
      const examSubjectIds = (exam.subjectIds || []).map((subjectId) =>
        String(subjectId),
      );
      const examTopicIds = (exam.topicIds || []).map((topicId) =>
        String(topicId),
      );
      const subjectNames = getNamesByIds(
        examSubjectIds,
        subjectIndex.subjectsById,
        "Subject",
      );
      const topicNames = getNamesByIds(examTopicIds, topicsById, "Topic");
      const statusText = exam.status ? "active true" : "inactive false";
      const matchesSearch =
        !query ||
        [
          exam.id,
          exam.name,
          subjectNames.join(" "),
          topicNames.join(" "),
          exam.publishedDate,
          exam.expiredDate,
          statusText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory = !categoryIds || categoryIds.has(examCategoryId);
      const matchesSubject =
        !subjectIds ||
        examSubjectIds.some((subjectId) => subjectIds.has(subjectId));
      const matchesTopic =
        !selectedTopicId || examTopicIds.includes(selectedTopicId);
      return matchesSearch && matchesCategory && matchesSubject && matchesTopic;
    });
  }, [
    categoryFilter,
    categoryIndex.childrenMap,
    exams,
    searchQuery,
    subjectFilter,
    subjectIndex.childrenMap,
    subjectIndex.subjectsById,
    topicFilter,
    topicsById,
  ]);

  const updateUrlFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    startTransition(() => {
      const queryString = nextParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const handleDelete = async (exam) => {
    const confirmed = window.confirm(`Delete ${exam.name}?`);
    if (!confirmed) return;

    try {
      await deleteExam(exam.id).unwrap();
      toast.success(`${exam.name} deleted.`);
    } catch (deleteError) {
      toast.error(
        getExamApiErrorMessage(deleteError, "Exam could not be deleted."),
      );
    }
  };

  const handleStatusChange = async (exam, checked) => {
    setPendingStatusIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(exam.id);
      return nextIds;
    });

    try {
      await updateExamStatus({
        id: exam.id,
        status: checked,
      }).unwrap();
      toast.success(`${exam.name} marked ${checked ? "active" : "inactive"}.`);
    } catch (statusError) {
      toast.error(
        getExamApiErrorMessage(
          statusError,
          "Exam status could not be updated.",
        ),
      );
    } finally {
      setPendingStatusIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(exam.id);
        return nextIds;
      });
    }
  };

  const handleQaUpload = async ({ documentType, file }) => {
    if (!uploadExam || !file) return;

    const formData = new FormData();
    const mutation =
      documentType === "question" ? updateQuestionPdf : updateDemoAnswerPdf;
    const bodyKey =
      documentType === "question" ? "questionPDF" : "demoAnswerPDF";

    formData.append(bodyKey, file, file.name);

    try {
      await mutation({ id: uploadExam.id, body: formData }).unwrap();
      toast.success(
        documentType === "question"
          ? "Question file uploaded."
          : "Demo answer file uploaded.",
      );
      setUploadExam(null);
    } catch (uploadError) {
      toast.error(
        getExamApiErrorMessage(uploadError, "File could not be uploaded."),
      );
    }
  };

  const activeInitialError =
    (!queryExamsData && initialExamsData?._error && initialExamsData) ||
    (!queryCategoriesData &&
      initialCategoriesData?._error &&
      initialCategoriesData) ||
    (!querySubjectsData &&
      initialSubjectsData?._error &&
      initialSubjectsData) ||
    (!queryTopicsData && initialTopicsData?._error && initialTopicsData) ||
    null;
  const activeError =
    examsError ||
    categoriesError ||
    subjectsError ||
    topicsError ||
    activeInitialError;
  const hasRequiredData =
    Boolean(examsData && !examsData._error) &&
    Boolean(categoriesData && !categoriesData._error) &&
    Boolean(subjectsData && !subjectsData._error) &&
    Boolean(topicsData && !topicsData._error);
  const isLoadingRequiredData =
    isLoadingExams ||
    isLoadingCategories ||
    isLoadingSubjects ||
    isLoadingTopics ||
    !hasHydratedInitialData;
  const isRefreshing =
    isFetchingExams ||
    isFetchingCategories ||
    isFetchingSubjects ||
    isFetchingTopics;

  const refetchAll = () => {
    refetchExams();
    refetchCategories();
    refetchSubjects();
    refetchTopics();
  };

  if (isLoadingRequiredData && !hasRequiredData && !activeError) {
    return <GlobalSpinner label="Loading exams..." />;
  }

  if (activeError && !hasRequiredData) {
    return (
      <ErrorCard
        title="Unable to load exams"
        message={getExamApiErrorMessage(
          activeError,
          "The exam data could not be loaded.",
        )}
        onRetry={refetchAll}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-8xl flex-col gap-6">
      <section className="flex gap-6 justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full">
          {/* Live Exams Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">Live Exams</p>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
              <div>
                <p className="text-xs text-muted">Total Exams</p>
                <p className="text-xl font-black text-foreground">
                  {totals.liveExams || 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Total Attendees
                </p>
                <p className="text-xl font-black text-foreground">
                  {totals.liveAttendees || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Exams Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">Upcoming Exams</p>
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
              <div>
                <p className="text-xs text-muted">Total Exams</p>
                <p className="text-xl font-black text-foreground">
                  {totals.upcomingExams || 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 text-nowrap">
                  Registered Students
                </p>
                <p className="text-xl font-black text-foreground">
                  {totals.upcomingRegistrations || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Archived Exams Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm border-l-4 border-l-slate-400">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">Archived Exams</p>
              <span className="flex h-2 w-2 rounded-full bg-slate-400" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
              <div>
                <p className="text-xs text-muted">Total Exams</p>
                <p className="text-xl font-black text-foreground">
                  {totals.archivedExams || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Past Attendees</p>
                <p className="text-xl font-black text-foreground">
                  {totals.archivedAttendees || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam operations
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            {pageConfig.title}
          </h1>
        </div>
      </section>

      <section className="surface-card p-4 px-1 w-full max-w-full overflow-hidden">
        <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.5fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(12rem,15rem)_auto_auto] xl:items-end">
          <label className="field-group min-w-0">
            <span className="field-label">Search exams</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  updateUrlFilters({ search: event.target.value.trimStart() })
                }
                className="field-input"
                placeholder="Search by name, subject, topic..."
                aria-label="Search exams"
              />
            </span>
          </label>

          <HierarchicalCategoryDropdown
            label="Category"
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={(option) =>
              updateUrlFilters({
                categoryID:
                  option.value === ALL_EXAM_CATEGORY_VALUE ? "" : option.value,
              })
            }
            placeholder="All categories"
            searchPlaceholder="Search categories..."
          />

          <button
            type="button"
            className="button button-secondary min-h-11 md:self-end"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <CreateExamBtn />
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 items-center">
            <h2 className="text-base font-semibold text-foreground">
              {pageConfig.listLabel}
            </h2>
            <p className="text-sm text-muted">
              ({filteredExams.length} of {exams.length} exams shown)
            </p>
          </div>
          {isRefreshing && (
            <GlobalSpinner
              label="Refreshing..."
              compact
              className="sm:justify-end"
            />
          )}
        </div>

        <div className="overflow-hidden">
          <Table className="table-fixed text-xs">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
              <col className="w-[7%]" />
            </colgroup>
            <TableHead>
              <tr>
                <TableTh className="px-3">Name</TableTh>
                <TableTh className="px-3">
                  Subjects
                  <br />
                  Name
                </TableTh>
                <TableTh className="px-3">
                  Topic &<br />
                  Source Name
                </TableTh>
                <TableTh className="px-3">
                  Exam
                  <br />
                  Timeline
                </TableTh>
                <TableTh className="px-3">
                  Duration
                  <br />
                  (min)
                </TableTh>
                <TableTh className="px-3">
                  Students
                  <br />
                  Participated
                </TableTh>
                <TableTh className="px-3">
                  Question &<br />
                  Answer
                </TableTh>
                <TableTh className="px-3">Status</TableTh>
                <TableTh className="px-2 text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const examSubjectIds = (exam.subjectIds || []).map((id) =>
                    String(id),
                  );
                  const examTopicIds = (exam.topicIds || []).map((id) =>
                    String(id),
                  );
                  const subjectNames = getNamesByIds(
                    examSubjectIds,
                    subjectIndex.subjectsById,
                    "Subject",
                  );
                  const topicNames = getNamesByIds(
                    examTopicIds,
                    topicsById,
                    "Topic",
                  );
                  const categoryPath = getPath(
                    categoryIndex.categoriesById,
                    getExamCategoryId(exam),
                  );
                  const sourceName =
                    categoryPath.map((category) => category.name).join(" / ") ||
                    exam.category?.name ||
                    "Unknown source";
                  const timeline = formatExamTimeline(exam);

                  return (
                    <TableRow key={exam.id}>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold leading-5 text-foreground">
                            {exam.name}
                          </p>
                          <p className="mt-1 break-all font-mono text-[10px] text-muted">
                            ID: {exam.id}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-wrap gap-1">
                          {subjectNames.map((name) => (
                            <span
                              key={name}
                              className="max-w-full rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold leading-4 text-foreground"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0">
                          <p className="break-words text-xs font-semibold leading-5 text-foreground">
                            {topicNames.join(", ") || "No topics"}
                          </p>
                          <p className="mt-1 break-words text-[11px] font-medium leading-4 text-muted">
                            {sourceName}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0 text-xs leading-5">
                          <p className="break-words font-semibold text-foreground">
                            Publish: {timeline.publish}
                          </p>
                          <p className="mt-1 break-words font-medium text-muted">
                            Expire: {timeline.expire}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top font-semibold text-foreground">
                        {exam.durationIntMinutes}
                      </TableTd>
                      <TableTd className="px-3 align-top font-semibold text-foreground">
                        {getExamParticipantCount(exam)}
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <PdfLink
                            href={exam.questionPDF}
                            label={getExamPdfLabel(
                              exam.questionPDFName,
                              "View question",
                            )}
                          />
                          <PdfLink
                            href={exam.demoAnswerPDF}
                            label={getExamPdfLabel(
                              exam.demoAnswerPDFName,
                              "View answer",
                            )}
                          />
                          {(!exam.questionPDF || !exam.demoAnswerPDF) && (
                            <QaUploadButton
                              disabled={
                                isUpdatingQuestionPdf || isUpdatingDemoAnswerPdf
                              }
                              onClick={() => setUploadExam(exam)}
                            />
                          )}
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <StatusToggle
                            checked={Boolean(exam.status)}
                            disabled={pendingStatusIds.has(exam.id)}
                            label={`Set ${exam.name} active status`}
                            onChange={(checked) =>
                              handleStatusChange(exam, checked)
                            }
                          />
                          <span className="text-[11px] font-semibold text-muted">
                            {exam.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableTd>
                      <TableTd className="px-2 align-top">
                        <ExamActionMenu exam={exam} onDelete={handleDelete} />
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd colSpan={9} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No exams found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {pageConfig.emptyMessage}
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TableContainer>

      {uploadExam && (
        <ExamQaUploadModal
          exam={uploadExam}
          isSubmitting={isUpdatingQuestionPdf || isUpdatingDemoAnswerPdf}
          onClose={() => setUploadExam(null)}
          onSubmit={handleQaUpload}
        />
      )}
    </div>
  );
}
