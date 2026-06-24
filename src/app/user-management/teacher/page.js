import TeacherTableClient from "@/app/user-management/teacher/TeacherTableClient";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_TEACHER_PAGE = 1;
const TEACHER_PAGE_LIMIT = 10;

function emptyTeacherResponse(message) {
  return {
    status: 500,
    message,
    teachers: [],
    pagination: {
      total: 0,
      page: FIRST_TEACHER_PAGE,
      limit: TEACHER_PAGE_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function getInitialTeachers() {
  const params = new URLSearchParams({
    page: String(FIRST_TEACHER_PAGE),
    limit: String(TEACHER_PAGE_LIMIT),
  });

  try {
    return await ssrFetch(`/auth/teacher/get-all-teachers?${params}`);
  } catch (error) {
    return emptyTeacherResponse(
      error?.message || "Unable to load teachers.",
    );
  }
}

export default async function TeacherManagementPage() {
  const initialData = await getInitialTeachers();

  return <TeacherTableClient initialData={initialData} />;
}
