import { RecordClassManager } from "@/features/record-class/RecordClassManager";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";
import { DEFAULT_RECORD_CLASSES } from "@/lib/recordClassData";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getRecordClassPageData() {
  // Replace these mocks with the recorded-class and category API calls when ready.
  return {
    categories: DEFAULT_EXAM_CATEGORIES,
    recordClasses: DEFAULT_RECORD_CLASSES,
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function RecordClassPage() {
  const { categories, recordClasses, subjects, topics } =
    await getRecordClassPageData();

  return (
    <RecordClassManager
      initialCategories={categories}
      initialRecordClasses={recordClasses}
      initialSubjects={subjects}
      initialTopics={topics}
    />
  );
}
