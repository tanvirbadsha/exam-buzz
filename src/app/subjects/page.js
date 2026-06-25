import { SubjectManager } from "@/features/subjects/SubjectManager";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_SUBJECT_PAGE = 1;
const SUBJECT_PAGE_LIMIT = 10;

function emptySubjectResponse(message) {
  return {
    status: 500,
    message,
    subjects: [],
    pagination: {
      total: 0,
      page: FIRST_SUBJECT_PAGE,
      limit: SUBJECT_PAGE_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function getInitialSubjects() {
  const params = new URLSearchParams({
    page: String(FIRST_SUBJECT_PAGE),
    limit: String(SUBJECT_PAGE_LIMIT),
  });

  try {
    return await ssrFetch(`/exam/subjects/get-all-subjects?${params}`);
  } catch (error) {
    return emptySubjectResponse(
      error?.message || "Unable to load subjects.",
    );
  }
}

export default async function SubjectsPage() {
  const initialData = await getInitialSubjects();

  return <SubjectManager initialData={initialData} />;
}
