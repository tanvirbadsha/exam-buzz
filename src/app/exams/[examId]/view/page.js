import { ExamViewPage } from "@/features/exams/ExamViewPage";
import { ssrFetch } from "@/lib/api/ssrFetch";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";

const FIRST_PAGE = 1;
const LOOKUP_LIMIT = 1000;

function emptyListResponse(key, message) {
  return {
    status: 500,
    message,
    [key]: [],
    pagination: {
      total: 0,
      page: FIRST_PAGE,
      limit: LOOKUP_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function safeSsrFetch(endpoint, key, fallbackMessage) {
  try {
    return await ssrFetch(endpoint);
  } catch (error) {
    return emptyListResponse(key, error?.message || fallbackMessage);
  }
}

async function getViewExamPageData() {
  const params = new URLSearchParams({
    page: String(FIRST_PAGE),
    limit: String(LOOKUP_LIMIT),
  });

  const [categoriesData, subjectsData, topicsData] = await Promise.all([
    safeSsrFetch(
      `/category/get-all-categories?${params}`,
      "categories",
      "Unable to load categories.",
    ),
    safeSsrFetch(
      `/exam/subjects/get-all-subjects?${params}`,
      "subjects",
      "Unable to load subjects.",
    ),
    safeSsrFetch(
      `/exam/topics/get-all-topics?${params}`,
      "topics",
      "Unable to load topics.",
    ),
  ]);

  return {
    categoriesData,
    packages: DEFAULT_PACKAGE_INFO,
    subjectsData,
    topicsData,
  };
}

export default async function ViewExamPage({ params }) {
  const { examId } = await params;
  const { categoriesData, packages, subjectsData, topicsData } =
    await getViewExamPageData();

  return (
    <ExamViewPage
      examId={examId}
      initialCategoriesData={categoriesData}
      initialPackages={packages}
      initialSubjectsData={subjectsData}
      initialTopicsData={topicsData}
    />
  );
}
