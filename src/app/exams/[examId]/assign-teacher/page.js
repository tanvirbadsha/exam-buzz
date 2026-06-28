import { AssignTeacherPage } from "@/features/exams/assign-teacher/AssignTeacherPage";

export default async function AssignTeacherRoute({ params }) {
  const { examId } = await params;

  return <AssignTeacherPage examId={examId} />;
}
