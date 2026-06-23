import { MaterialManager } from "@/features/materials/MaterialManager";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";
import { DEFAULT_MATERIALS } from "@/lib/materialData";
import {
  DEFAULT_EXAM_SUBJECTS,
  DEFAULT_SUBJECT_TOPICS,
} from "@/lib/subjectData";

async function getMaterialPageData() {
  // Replace these mocks with the material, category, and folder API calls when ready.
  return {
    categories: DEFAULT_EXAM_CATEGORIES,
    materials: DEFAULT_MATERIALS,
    subjects: DEFAULT_EXAM_SUBJECTS,
    topics: DEFAULT_SUBJECT_TOPICS,
  };
}

export default async function MaterialsPage() {
  const { categories, materials, subjects, topics } =
    await getMaterialPageData();

  return (
    <MaterialManager
      initialCategories={categories}
      initialMaterials={materials}
      initialSubjects={subjects}
      initialTopics={topics}
    />
  );
}
