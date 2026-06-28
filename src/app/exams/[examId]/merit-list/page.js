import { MeritListPage } from "@/features/exams/merit-list/MeritListPage";

export default async function ExamMeritListRoute({ params }) {
  const { examId } = await params;

  return <MeritListPage examId={examId} />;
}
