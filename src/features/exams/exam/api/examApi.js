import { apiSlice } from "@/store/apiSlice";

export const examApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createExam: builder.mutation({
      query: (data) => ({
        url: "/exam/exams/create-exam",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Exam", id: "LIST" }],
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
      providesTags: (result) => [
        { type: "Exam", id: "LIST" },
        ...(result?.exams || []).map((exam) => ({
          type: "Exam",
          id: String(exam.id),
        })),
      ],
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
      providesTags: (result) => [
        { type: "Exam", id: "UPCOMING" },
        ...(result?.exams || []).map((exam) => ({
          type: "Exam",
          id: String(exam.id),
        })),
      ],
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
      providesTags: (result) => [
        { type: "Exam", id: "LIVE" },
        ...(result?.exams || []).map((exam) => ({
          type: "Exam",
          id: String(exam.id),
        })),
      ],
    }),
    getExamById: builder.query({
      query: (id) => ({
        url: `/exam/exams/get-exam/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Exam", id: String(id) },
      ],
    }),
    updateExam: builder.mutation({
      query: ({ id, body, ...data }) => ({
        url: `/exam/exams/update-exam/${id}`,
        method: "PATCH",
        body: body || data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Exam", id: "LIST" },
        { type: "Exam", id: "UPCOMING" },
        { type: "Exam", id: "LIVE" },
        { type: "Exam", id: String(id) },
      ],
    }),
    updateExamStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-exam-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(
        { id, status },
        { dispatch, getState, queryFulfilled },
      ) {
        const nextStatus = status === true || status === "true";
        const patchResults = [];
        const queries = getState()[examApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (
            !["getAllExams", "getUpcomingExams", "getLiveExams"].includes(
              query?.endpointName,
            ) ||
            !query.originalArgs
          ) {
            continue;
          }

          patchResults.push(
            dispatch(
              examApi.util.updateQueryData(
                query.endpointName,
                query.originalArgs,
                (draft) => {
                  const exam = draft?.exams?.find(
                    (item) => String(item.id) === String(id),
                  );

                  if (exam) {
                    exam.status = nextStatus;
                  }
                },
              ),
            ),
          );
        }

        patchResults.push(
          dispatch(
            examApi.util.updateQueryData("getExamById", id, (draft) => {
              const exam = draft?.exam || draft;

              if (exam) {
                exam.status = nextStatus;
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
        error ? [{ type: "Exam", id: String(id) }] : [],
    }),
    updateQuestionPdf: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-question-pdf/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Exam", id: "LIST" },
        { type: "Exam", id: String(id) },
      ],
    }),
    updateDemoAnswerPdf: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/exams/update-demo-answer-pdf/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Exam", id: "LIST" },
        { type: "Exam", id: String(id) },
      ],
    }),
    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exam/exams/delete-exam/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Exam", id: "LIST" },
        { type: "Exam", id: "UPCOMING" },
        { type: "Exam", id: "LIVE" },
        { type: "Exam", id: String(id) },
      ],
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
