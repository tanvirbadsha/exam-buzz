import { apiSlice } from "@/store/apiSlice";

export const examTypesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createExamType: builder.mutation({
      query: (data) => ({
        url: "/exam/exam-types/create-exam-type",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "ExamType", id: "LIST" }],
    }),
    getAllExamTypes: builder.query({
      query: ({ search, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/exam-types/get-all-exam-types?${queryString}`
            : "/exam/exam-types/get-all-exam-types",
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "ExamType", id: "LIST" },
        ...(result?.examTypes || []).map((examType) => ({
          type: "ExamType",
          id: examType.id,
        })),
      ],
    }),
    getExamTypeById: builder.query({
      query: (id) => ({
        url: `/exam/exam-types/get-exam-type/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "ExamType", id },
      ],
    }),
    updateExamType: builder.mutation({
      query: ({ id, body, ...data }) => {
        return {
          url: `/exam/exam-types/update-exam-type/${id}`,
          method: "PATCH",
          body: body || data,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ExamType", id: "LIST" },
        { type: "ExamType", id },
      ],
    }),
    deleteExamType: builder.mutation({
      query: (id) => ({
        url: `/exam/exam-types/delete-exam-type/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "ExamType", id: "LIST" },
        { type: "ExamType", id },
      ],
    }),
  }),
});

export const {
  useCreateExamTypeMutation,
  useGetAllExamTypesQuery,
  useGetExamTypeByIdQuery,
  useUpdateExamTypeMutation,
  useDeleteExamTypeMutation,
} = examTypesApi;
