import { apiSlice } from "@/store/apiSlice";

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query({
      query: ({ search, page, limit, status } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());
        if (status && status !== "all") {
          params.append("status", status === "active" ? "true" : "false");
        }

        const queryString = params.toString();
        return {
          url: queryString
            ? `/category/get-all-categories?${queryString}`
            : "/category/get-all-categories",
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "Category", id: "LIST" },
        ...(result?.categories || []).map((category) => ({
          type: "Category",
          id: category.id,
        })),
      ],
    }),
    getCategoryById: builder.query({
      query: (id) => ({
        url: `/category/get-category/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Category", id }],
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: "/category/create-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/category/update-category/${id}`,
        method: "PATCH",
        body: data.body || data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Category", id: "LIST" },
        { type: "Category", id },
      ],
    }),
    updateCategoryStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/category/update-category-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const patchResults = [];
        const queries = getState()[categoryApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (
            query?.endpointName !== "getAllCategories" ||
            !query.originalArgs
          ) {
            continue;
          }

          patchResults.push(
            dispatch(
              categoryApi.util.updateQueryData(
                "getAllCategories",
                query.originalArgs,
                (draft) => {
                  const category = draft?.categories?.find(
                    (item) => String(item.id) === String(id),
                  );

                  if (category) {
                    category.status = status;
                  }
                },
              ),
            ),
          );
        }

        patchResults.push(
          dispatch(
            categoryApi.util.updateQueryData("getCategoryById", id, (draft) => {
              const category = draft?.category || draft?.data?.category || draft;

              if (category) {
                category.status = status;
              }
            }),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [{ type: "Category", id }] : [],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/category/delete-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Category", id: "LIST" },
        { type: "Category", id },
      ],
    }),
  }),
});

export const {
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useUpdateCategoryStatusMutation,
  useDeleteCategoryMutation,
} = categoryApi;
