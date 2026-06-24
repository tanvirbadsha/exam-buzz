import { ExamTypeManager } from "@/features/exams/exam-types/ExamTypeManager";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_EXAM_TYPE_PAGE = 1;
const EXAM_TYPE_PAGE_LIMIT = 10;

function emptyExamTypesResponse(message, query) {
  return {
    status: 500,
    message,
    examTypes: [],
    pagination: {
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
    },
    _error: true,
  };
}

function parsePositiveInteger(value, fallback) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

async function getInitialExamTypes({ page, limit }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  try {
    return await ssrFetch(`/exam/exam-types/get-all-exam-types?${params}`);
  } catch (error) {
    return emptyExamTypesResponse(
      error?.message || "Unable to load exam types.",
      { page, limit },
    );
  }
}

export default async function ExamTypesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialQuery = {
    page: parsePositiveInteger(
      resolvedSearchParams?.page,
      FIRST_EXAM_TYPE_PAGE,
    ),
    limit: parsePositiveInteger(
      resolvedSearchParams?.limit,
      EXAM_TYPE_PAGE_LIMIT,
    ),
  };
  const initialData = await getInitialExamTypes(initialQuery);

  return (
    <ExamTypeManager initialData={initialData} initialQuery={initialQuery} />
  );
}
