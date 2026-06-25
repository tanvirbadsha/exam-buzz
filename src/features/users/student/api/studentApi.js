import { apiSlice } from "@/store/apiSlice";

export const studentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStudentProfile: builder.query({
      query: () => ({
        url: "/auth/student/get-profile",
        method: "GET",
      }),
      providesTags: [{ type: "User", id: "Student-Profile" }],
    }),
    getStudentById: builder.query({
      query: (id) => ({
        url: `/auth/student/get-student/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "User", id: `Student-${id}` },
      ],
    }),
    getAllStudents: builder.query({
      query: ({ search, page, limit }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        return {
          url: `/auth/student/get-all-students?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "User", id: "Student-LIST" },
        ...(result?.students || []).map((student) => ({
          type: "User",
          id: `Student-${student.id}`,
        })),
      ],
    }),
    updateStudentProfile: builder.mutation({
      query: (data) => {
        const hasWrappedBody =
          data &&
          typeof data === "object" &&
          "body" in data &&
          !(data instanceof FormData);
        const id = hasWrappedBody ? data.id : undefined;
        const body = hasWrappedBody ? data.body : data;

        return {
          url: id
            ? `/auth/student/update-profile/${id}`
            : "/auth/student/update-profile",
          method: "PATCH",
          body,
        };
      },
      invalidatesTags: (_result, _error, data) => {
        const id =
          data &&
          typeof data === "object" &&
          "id" in data &&
          !(data instanceof FormData)
            ? data.id
            : undefined;

        return [
          { type: "User", id: "Student-LIST" },
          { type: "User", id: "Student-Profile" },
          ...(id ? [{ type: "User", id: `Student-${id}` }] : []),
        ];
      },
    }),
    updateStudentStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/auth/student/update-student-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const nextStatus = status === true || status === "true";
        const patchResults = [];
        const queries = getState()[studentApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (query?.endpointName !== "getAllStudents" || !query.originalArgs) {
            continue;
          }

          patchResults.push(
            dispatch(
              studentApi.util.updateQueryData(
                "getAllStudents",
                query.originalArgs,
                (draft) => {
                  const student = draft?.students?.find(
                    (item) => String(item.id) === String(id),
                  );

                  if (student) {
                    student.status = nextStatus;
                    student.isActive = nextStatus;
                  }
                },
              ),
            ),
          );
        }

        patchResults.push(
          dispatch(
            studentApi.util.updateQueryData("getStudentById", id, (draft) => {
              const student = draft?.student || draft;

              if (student) {
                student.status = nextStatus;
                student.isActive = nextStatus;
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
        { type: "User", id: `Student-${id}` },
      ],
    }),
    resetStudentPassByAdmin: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/auth/student/reset-password-by-admin/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteStudent: builder.mutation({
      query: () => ({
        url: "/auth/student/delete-student",
        method: "DELETE",
      }),
    }),
    deleteStudentByAdmin: builder.mutation({
      query: (id) => ({
        url: `/auth/student/delete-student-by-admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id: "Student-LIST" },
        { type: "User", id: `Student-${id}` },
      ],
    }),
    registerStudent: builder.mutation({
      query: (data) => ({
        url: "/auth/student/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "Student-LIST" }],
    }),
    loginStudent: builder.mutation({
      query: (data) => ({
        url: "/auth/student/login",
        method: "POST",
        body: data,
      }),
    }),
    changeStudentPass: builder.mutation({
      query: ({ id, ...data }) => ({
        url: id
          ? `/auth/student/reset-password-by-admin/${id}`
          : "/auth/student/change-password",
        method: id ? "PATCH" : "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetStudentProfileQuery,
  useGetStudentByIdQuery,
  useGetAllStudentsQuery,
  useUpdateStudentProfileMutation,
  useUpdateStudentStatusMutation,
  useResetStudentPassByAdminMutation,
  useDeleteStudentMutation,
  useDeleteStudentByAdminMutation,
  useRegisterStudentMutation,
  useLoginStudentMutation,
  useChangeStudentPassMutation,
} = studentApi;
