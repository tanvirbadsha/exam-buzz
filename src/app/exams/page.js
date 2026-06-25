import { ExamManager } from "@/features/exams/ExamManager";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_PAGE = 1;
const EXAM_LIST_LIMIT = 1000;
const LOOKUP_LIMIT = 1000;

function emptyListResponse(key, message, limit) {
  return {
    status: 500,
    message,
    [key]: [],
    pagination: {
      total: 0,
      page: FIRST_PAGE,
      limit,
      totalPages: 0,
    },
    _error: true,
  };
}

async function safeSsrFetch(endpoint, key, fallbackMessage, limit) {
  try {
    return await ssrFetch(endpoint);
  } catch (error) {
    return emptyListResponse(
      key,
      error?.message || fallbackMessage,
      limit,
    );
  }
}

async function getExamPageData() {
  const examParams = new URLSearchParams({
    page: String(FIRST_PAGE),
    limit: String(EXAM_LIST_LIMIT),
  });
  const lookupParams = new URLSearchParams({
    page: String(FIRST_PAGE),
    limit: String(LOOKUP_LIMIT),
  });

  const [examsData, categoriesData, subjectsData, topicsData] =
    await Promise.all([
      safeSsrFetch(
        `/exam/exams/get-all-exams?${examParams}`,
        "exams",
        "Unable to load exams.",
        EXAM_LIST_LIMIT,
      ),
      safeSsrFetch(
        `/category/get-all-categories?${lookupParams}`,
        "categories",
        "Unable to load categories.",
        LOOKUP_LIMIT,
      ),
      safeSsrFetch(
        `/exam/subjects/get-all-subjects?${lookupParams}`,
        "subjects",
        "Unable to load subjects.",
        LOOKUP_LIMIT,
      ),
      safeSsrFetch(
        `/exam/topics/get-all-topics?${lookupParams}`,
        "topics",
        "Unable to load topics.",
        LOOKUP_LIMIT,
      ),
    ]);

  return {
    categoriesData,
    examsData,
    subjectsData,
    topicsData,
  };
}

export default async function ExamsPage() {
  const { categoriesData, examsData, subjectsData, topicsData } =
    await getExamPageData();

  return (
    <ExamManager
      initialCategoriesData={categoriesData}
      initialExamsData={examsData}
      initialSubjectsData={subjectsData}
      initialTopicsData={topicsData}
    />
  );
}
