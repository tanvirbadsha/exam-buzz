import { CategoryManager } from "@/features/categories/CategoryManager";
import { DEFAULT_EXAM_CATEGORIES } from "@/lib/categoryData";

async function getCategories() {
  // Replace this mock with the categories API call when the endpoint is ready.
  return DEFAULT_EXAM_CATEGORIES;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoryManager initialCategories={categories} />;
}
