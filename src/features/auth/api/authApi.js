import { ROLES } from "@/lib/auth/constants";
import { clearAuthTokenCookie, setAuthTokenCookie } from "@/lib/auth";
import { apiSlice } from "@/store/apiSlice";
import { clearCredentials, setCredentials } from "@/store/authSlice";

function getAuthPayload(result) {
  const user = result?.user || result?.admin || null;
  const role =
    result?.role || user?.role || (result?.admin ? ROLES.ADMIN : null);
  const token = result?.token || null;

  return { user, role, token };
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/admin/login",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_data, { dispatch, queryFulfilled }) {
        try {
          const { data: responseData } = await queryFulfilled;
          const authPayload = getAuthPayload(responseData);

          dispatch(setCredentials(authPayload));
          setAuthTokenCookie(authPayload.token);
        } catch {
          dispatch(clearCredentials());
          clearAuthTokenCookie();
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/admin/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
        } finally {
          dispatch(clearCredentials());
          clearAuthTokenCookie();
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),
    registerAdmin: builder.mutation({
      query: (data) => ({
        url: `/auth/admin/register`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "Admin-LIST" }],
    }),
    changeAdminPassword: builder.mutation({
      query: (data) => ({
        url: `/auth/admin/change-password`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(_data, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Handle error if needed
        }
      },
    }),
    getAdminProfile: builder.query({
      query: () => ({
        url: `/auth/admin/get-profile`,
        method: "GET",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: responseData } = await queryFulfilled;
          dispatch(setCredentials(getAuthPayload(responseData)));
        } catch {
          dispatch(clearCredentials());
        }
      },
      providesTags: [{ type: "User", id: "Admin-Profile" }],
    }),
    getAdminById: builder.query({
      query: (id) => ({
        url: `/auth/admin/get-admin/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "User", id: String(id) },
      ],
    }),
    getAllAdmins: builder.query({
      query: ({ search, page, limit }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        return {
          url: `/auth/admin/get-all-admins?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "User", id: "Admin-LIST" },
        ...(result?.admins || []).map((admin) => ({
          type: "User",
          id: String(admin.id),
        })),
      ],
    }),
    updateAdminProfile: builder.mutation({
      query: (data) => ({
        url: `/auth/admin/update-profile`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: "User", id: "Admin-LIST" },
        { type: "User", id: "Admin-Profile" },
        ...(result?.admin?.id
          ? [{ type: "User", id: String(result.admin.id) }]
          : []),
      ],
    }),
    changeSuperAdminStatus: builder.mutation({
      query: (data) => {
        const id = typeof data === "object" ? data.id : data;
        const isSuperAdmin =
          typeof data === "object" ? data.isSuperAdmin : undefined;

        return {
          url: `/auth/admin/change-super-admin/${id}`,
          method: "PATCH",
          ...(isSuperAdmin === undefined
            ? {}
            : { body: { isSuperAdmin } }),
        };
      },
      invalidatesTags: (_result, _error, data) => {
        const id = typeof data === "object" ? data.id : data;

        return [
          { type: "User", id: "Admin-LIST" },
          { type: "User", id: String(id) },
        ];
      },
    }),
    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `/auth/admin/delete-admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id: "Admin-LIST" },
        { type: "User", id: String(id) },
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterAdminMutation,
  useChangeAdminPasswordMutation,
  useGetAdminProfileQuery,
  useGetAdminByIdQuery,
  useGetAllAdminsQuery,
  useUpdateAdminProfileMutation,
  useChangeSuperAdminStatusMutation,
  useDeleteAdminMutation,
} = authApi;
