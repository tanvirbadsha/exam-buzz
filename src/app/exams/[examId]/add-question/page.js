import { QuestionFormPage } from "@/features/exams/sections/QuestionFormPage";

export default async function AddQuestionToExamPage({ params }) {
  const { examId } = await params;

  return <QuestionFormPage initialExamId={examId} />;
}
