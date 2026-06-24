import { apiSlice } from "@/store/apiSlice";

export const teacherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerTeacher: builder.mutation({
      query: (data) => ({
        url: "/auth/teacher/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "Teacher-LIST" }],
    }),
    loginTeacher: builder.mutation({
      query: (data) => ({
        url: "/auth/teacher/login",
        method: "POST",
        body: data,
      }),
    }),
    changeTeacherPass: builder.mutation({
      query: (data) => ({
        url: "/auth/teacher/change-password",
        method: "POST",
        body: data,
      }),
    }),
    getTeacherProfile: builder.query({
      query: () => ({
        url: "/auth/teacher/get-profile",
        method: "GET",
      }),
    }),
    getTeacherById: builder.query({
      query: (id) => ({
        url: `/auth/teacher/get-teacher/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "User", id: `Teacher-${id}` },
      ],
    }),
    getAllTeachers: builder.query({
      query: ({ search, page, limit }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        return {
          url: `/auth/teacher/get-all-teachers?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "User", id: "Teacher-LIST" },
        ...(result?.teachers || []).map((teacher) => ({
          type: "User",
          id: `Teacher-${teacher.id}`,
        })),
      ],
    }),
    // updateTeacherProfile: builder.mutation({
    //   query: (data) => ({
    //     url: "/auth/teacher/update-profile",
    //     method: "PATCH",
    //     body: data,
    //   }),
    // }),
    updateTeacherStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/auth/teacher/update-teacher-status/${id}`,
        method: "PATCH",
        body: data,
      }),
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const nextStatus = status === true || status === "true";
        const patchResults = [];
        const queries = getState()[teacherApi.reducerPath]?.queries || {};

        for (const query of Object.values(queries)) {
          if (query?.endpointName !== "getAllTeachers" || !query.originalArgs) {
            continue;
          }

          patchResults.push(
            dispatch(
              teacherApi.util.updateQueryData(
                "getAllTeachers",
                query.originalArgs,
                (draft) => {
                  const teacher = draft?.teachers?.find(
                    (item) => String(item.id) === String(id),
                  );

                  if (teacher) {
                    teacher.status = nextStatus;
                    teacher.isActive = nextStatus;
                  }
                },
              ),
            ),
          );
        }

        patchResults.push(
          dispatch(
            teacherApi.util.updateQueryData("getTeacherById", id, (draft) => {
              const teacher = draft?.teacher || draft;

              if (teacher) {
                teacher.status = nextStatus;
                teacher.isActive = nextStatus;
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
        { type: "User", id: `Teacher-${id}` },
      ],
    }),
    resetTeacherPassByAdmin: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/auth/teacher/reset-password-by-admin/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id: `Teacher-${id}` },
      ],
    }),
    deleteTeacherByAdmin: builder.mutation({
      query: (id) => ({
        url: `/auth/teacher/delete-teacher-by-admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id: "Teacher-LIST" },
        { type: "User", id: `Teacher-${id}` },
      ],
    }),
  }),
});

export const {
  useRegisterTeacherMutation,
  useLoginTeacherMutation,
  useChangeTeacherPassMutation,
  useGetTeacherProfileQuery,
  useGetTeacherByIdQuery,
  useGetAllTeachersQuery,
  //useUpdateTeacherProfileMutation,
  useUpdateTeacherStatusMutation,
  useResetTeacherPassByAdminMutation,
  useDeleteTeacherByAdminMutation,
} = teacherApi;
