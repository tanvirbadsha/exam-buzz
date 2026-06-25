import { ExamFormPage } from "@/features/exams/ExamFormPage";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";
import { DEFAULT_EXAMS } from "@/lib/examData";
import { DEFAULT_PACKAGE_INFO } from "@/lib/packageInfoData";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getCreateExamPageData() {
  // Replace these mocks with the categories, subjects, topics, and exams API calls when ready.
  return {
    categories: DEFAULT_EXAM_CATEGORIES,
    exams: DEFAULT_EXAMS,
    packages: DEFAULT_PACKAGE_INFO,
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function CreateExamPage() {
  const { categories, exams, packages, subjects, topics } =
    await getCreateExamPageData();

  return (
    <ExamFormPage
      initialCategories={categories}
      initialExams={exams}
      initialPackages={packages}
      initialSubjects={subjects}
      initialTopics={topics}
      mode="create"
    />
  );
}
