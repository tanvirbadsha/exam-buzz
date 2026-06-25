import { ExamManager } from "@/features/exams/ExamManager";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";
import { DEFAULT_EXAMS } from "@/lib/examData";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getExamPageData() {
  // Replace these mocks with the exams, categories, subjects, and topics API calls when ready.
  return {
    categories: DEFAULT_EXAM_CATEGORIES,
    exams: DEFAULT_EXAMS,
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function ExamsPage() {
  const { categories, exams, subjects, topics } = await getExamPageData();

  return (
    <ExamManager
      initialCategories={categories}
      initialExams={exams}
      initialSubjects={subjects}
      initialTopics={topics}
    />
  );
}
