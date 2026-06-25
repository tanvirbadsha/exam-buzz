import { CategoryManager } from "@/features/categories/CategoryManager";
import { ssrFetch } from "@/lib/api/ssrFetch";

const FIRST_CATEGORY_PAGE = 1;
const CATEGORY_PAGE_LIMIT = 10;

function emptyCategoryResponse(message) {
  return {
    status: 500,
    message,
    categories: [],
    pagination: {
      total: 0,
      page: FIRST_CATEGORY_PAGE,
      limit: CATEGORY_PAGE_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function getInitialCategories() {
  const params = new URLSearchParams({
    page: String(FIRST_CATEGORY_PAGE),
    limit: String(CATEGORY_PAGE_LIMIT),
  });

  try {
    return await ssrFetch(`/category/get-all-categories?${params}`);
  } catch (error) {
    return emptyCategoryResponse(
      error?.message || "Unable to load categories.",
    );
  }
}

export default async function CategoriesPage() {
  const initialData = await getInitialCategories();

  return <CategoryManager initialData={initialData} />;
}
