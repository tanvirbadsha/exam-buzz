import { apiSlice } from "@/store/apiSlice";

export const examApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createExam: builder.mutation({
      query: (data) => ({
        url: "/exam/exams/create-exam",
        method: "POST",
        body: data,
      }),
    }),
    getAllExams: builder.query({
      query: ({ search, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/exams/get-all-exams?${queryString}`
            : "/exam/exams/get-all-exams",
          method: "GET",
        };
      },
    }),
    getUpcomingExams: builder.query({
      query: ({ search, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/exams/get-upcoming-exams?${queryString}`
            : "/exam/exams/get-upcoming-exams",
          method: "GET",
        };
      },
    }),
    getLiveExams: builder.query({
      query: ({ search, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/exams/get-live-exams?${queryString}`
            : "/exam/exams/get-live-exams",
          method: "GET",
        };
      },
    }),
    getExamById: builder.query({
      query: (id) => ({
        url: `/exam/exams/get-exam/${id}`,
        method: "GET",
      }),
    }),
    updateExam: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-exam/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateExamStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-exam-status/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateQuestionPdf: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-question-pdf/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateDemoAnswerPdf: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-demo-answer-pdf/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exam/exams/delete-exam/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateExamMutation,
  useGetAllExamsQuery,
  useGetUpcomingExamsQuery,
  useGetLiveExamsQuery,
  useGetExamByIdQuery,
  useUpdateExamMutation,
  useUpdateExamStatusMutation,
  useUpdateQuestionPdfMutation,
  useUpdateDemoAnswerPdfMutation,
  useDeleteExamMutation,
} = examApi;
