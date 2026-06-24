import StudentTableClient from "@/app/user-management/students/StudentTableClient";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_STUDENT_PAGE = 1;
const STUDENT_PAGE_LIMIT = 10;

function emptyStudentResponse(message) {
  return {
    status: 500,
    message,
    students: [],
    pagination: {
      total: 0,
      page: FIRST_STUDENT_PAGE,
      limit: STUDENT_PAGE_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function getInitialStudents() {
  const params = new URLSearchParams({
    page: String(FIRST_STUDENT_PAGE),
    limit: String(STUDENT_PAGE_LIMIT),
  });

  try {
    return await ssrFetch(`/auth/student/get-all-students?${params}`);
  } catch (error) {
    return emptyStudentResponse(
      error?.message || "Unable to load students.",
    );
  }
}

export default async function StudentManagementPage() {
  const initialData = await getInitialStudents();

  return <StudentTableClient initialData={initialData} />;
}
