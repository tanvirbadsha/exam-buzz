import { SubjectManager } from "@/features/subjects/SubjectManager";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getSubjects() {
  // Replace this mock with the subjects API call when the endpoint is ready.
  return {
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function SubjectsPage() {
  const { subjects, topics } = await getSubjects();

  return <SubjectManager initialSubjects={subjects} initialTopics={topics} />;
}
