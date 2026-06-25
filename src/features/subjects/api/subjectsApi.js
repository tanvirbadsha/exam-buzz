import { apiSlice } from "@/store/apiSlice";

export const subjectsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSubject: builder.mutation({
      query: (data) => ({
        url: "/exam/subjects/create-subject",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),
    getAllSubject: builder.query({
      query: ({ page, limit, search, parentID, status } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());
        if (search) params.append("search", search);
        if (parentID !== undefined && parentID !== null && parentID !== "") {
          params.append("parentID", parentID.toString());
        }
        if (status !== undefined && status !== null && status !== "") {
          params.append("status", status.toString());
        }

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/subjects/get-all-subjects?${queryString}`
            : "/exam/subjects/get-all-subjects",
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "Subject", id: "LIST" },
        ...(result?.subjects || []).map((subject) => ({
          type: "Subject",
          id: subject.id,
        })),
      ],
    }),
    getSubjectById: builder.query({
      query: (id) => ({
        url: `/exam/subjects/get-subject/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Subject", id }],
    }),
    updateSubject: builder.mutation({
      query: ({ id, body, ...data }) => ({
        url: `/exam/subjects/update-subject/${id}`,
        method: "PATCH",
        body: body || data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subject", id: "LIST" },
        { type: "Subject", id },
      ],
    }),
    updateSubjectStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/subjects/update-subject-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted(
        { id, status },
        { dispatch, getState, queryFulfilled },
      ) {
        const nextStatus = status === true || status === "true";
        const patchResults = [];
        const queries = getState()[subjectsApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (query?.endpointName !== "getAllSubject" || !query.originalArgs) {
            continue;
          }

          patchResults.push(
            dispatch(
              subjectsApi.util.updateQueryData(
                "getAllSubject",
                query.originalArgs,
                (draft) => {
                  const subject = draft?.subjects?.find(
                    (item) => String(item.id) === String(id),
                  );

                  if (subject) {
                    subject.status = nextStatus;
                  }
                },
              ),
            ),
          );
        }

        patchResults.push(
          dispatch(
            subjectsApi.util.updateQueryData("getSubjectById", id, (draft) => {
              const subject = draft?.subject || draft;

              if (subject) {
                subject.status = nextStatus;
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Subject", id },
      ],
    }),
    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/exam/subjects/delete-subject/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Subject", id: "LIST" },
        { type: "Subject", id },
      ],
    }),
  }),
});

export const {
  useCreateSubjectMutation,
  useGetAllSubjectQuery,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  useUpdateSubjectStatusMutation,
  useDeleteSubjectMutation,
} = subjectsApi;
