import { ExamViewPage } from "@/features/exams/ExamViewPage";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";
import { DEFAULT_EXAMS } from "@/lib/examData";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getViewExamPageData() {
  // Replace these mocks with the selected exam, categories, subjects, topics, and packages API calls when ready.
  return {
    categories: DEFAULT_EXAM_CATEGORIES,
    exams: DEFAULT_EXAMS,
    packages: DEFAULT_PACKAGE_INFO,
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function ViewExamPage({ params }) {
  const { categories, exams, packages, subjects, topics } =
    await getViewExamPageData();

  return (
    <ExamViewPage
      examId={params.examId}
      initialCategories={categories}
      initialExams={exams}
      initialPackages={packages}
      initialSubjects={subjects}
      initialTopics={topics}
    />
  );
}
