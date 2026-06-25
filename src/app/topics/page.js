import { TopicManager } from "@/features/topics/TopicManager";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getTopicsPayload() {
  // Replace this mock with the topics API call when the endpoint is ready.
  return {
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function TopicsPage() {
  const { subjects, topics } = await getTopicsPayload();

  return <TopicManager initialSubjects={subjects} initialTopics={topics} />;
}
