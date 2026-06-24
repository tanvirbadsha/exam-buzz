import { ExamTypeManager } from "@/features/exam-types/ExamTypeManager";
import { DEFAULT_EXAM_TYPES_RESPONSE } from "@/lib/examTypeData";

async function getExamTypes() {
  // Replace this mock with the exam types API call when the endpoint is ready.
  return DEFAULT_EXAM_TYPES_RESPONSE;
}

export default async function ExamTypesPage() {
  const { examTypes } = await getExamTypes();

  return <ExamTypeManager initialExamTypes={examTypes} />;
}
