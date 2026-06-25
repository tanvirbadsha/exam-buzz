import { apiSlice } from "@/store/apiSlice";

export const topicsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTopic: builder.mutation({
      query: (data) => ({
        url: "/exam/topics/create-topic",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Topic", id: "LIST" }],
    }),
    getAllTopics: builder.query({
      query: ({ search, subjectID, status, page, limit } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (subjectID) params.append("subjectID", subjectID.toString());
        if (typeof status === "boolean") {
          params.append("status", status.toString());
        }
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        return {
          url: queryString
            ? `/exam/topics/get-all-topics?${queryString}`
            : "/exam/topics/get-all-topics",
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "Topic", id: "LIST" },
        ...(result?.topics || []).map((topic) => ({
          type: "Topic",
          id: String(topic.id),
        })),
      ],
    }),
    getTopicById: builder.query({
      query: (id) => ({
        url: `/exam/topics/get-topic/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Topic", id: String(id) }],
    }),
    updateTopic: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/topics/update-topic/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Topic", id: "LIST" },
        { type: "Topic", id: String(id) },
      ],
    }),
    updateTopicStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/exam/topics/update-topic-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const nextStatus = status === true || status === "true";
        const patchResults = [];
        const queries = getState()[topicsApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (query?.endpointName !== "getAllTopics" || !query.originalArgs) {
            continue;
          }

          patchResults.push(
            dispatch(
              topicsApi.util.updateQueryData(
                "getAllTopics",
                query.originalArgs,
                (draft) => {
                  if (!Array.isArray(draft?.topics)) return;

                  const topicIndex = draft.topics.findIndex(
                    (item) => String(item.id) === String(id),
                  );
                  if (topicIndex === -1) return;

                  const statusFilter = query.originalArgs?.status;
                  if (
                    typeof statusFilter === "boolean" &&
                    statusFilter !== nextStatus
                  ) {
                    draft.topics.splice(topicIndex, 1);
                    return;
                  }

                  draft.topics[topicIndex].status = nextStatus;
                  draft.topics[topicIndex].updatedAt = new Date().toISOString();
                },
              ),
            ),
          );
        }

        [id, String(id)].forEach((topicId) => {
          patchResults.push(
            dispatch(
              topicsApi.util.updateQueryData("getTopicById", topicId, (draft) => {
                const topic = draft?.topic || draft;

                if (topic) {
                  topic.status = nextStatus;
                  topic.updatedAt = new Date().toISOString();
                }
              }),
            ),
          );
        });

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Topic", id: "LIST" },
        { type: "Topic", id: String(id) },
      ],
    }),
    deleteTopic: builder.mutation({
      query: (id) => ({
        url: `/exam/topics/delete-topic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Topic", id: "LIST" },
        { type: "Topic", id: String(id) },
      ],
    }),
  }),
});

export const {
  useCreateTopicMutation,
  useGetAllTopicsQuery,
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
  useUpdateTopicStatusMutation,
  useDeleteTopicMutation,
} = topicsApi;
