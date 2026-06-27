import { apiSlice } from "@/store/apiSlice";

export const sectionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new section (POST)
    createSection: builder.mutation({
      query: (body) => ({
        url: `/exam/sections/create-section`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Section", id: "LIST" }],
    }),

    // Get all sections (GET)
    getAllSections: builder.query({
      query: () => `/exam/sections/get-all-sections`,
      providesTags: (result) => [
        { type: "Section", id: "LIST" },
        ...(result?.sections || []).map((section) => ({
          type: "Section",
          id: String(section.id),
        })),
      ],
    }),

    // Get a specific section by ID (GET)
    getSectionById: builder.query({
      query: (id) => `/exam/sections/get-section/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Section", id: String(id) },
      ],
    }),

    // Update a section by ID (PATCH)
    updateSection: builder.mutation({
      query: ({ id, body, ...data }) => ({
        url: `/exam/sections/update-section/${id}`,
        method: "PATCH",
        body: body || data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Section", id: "LIST" },
        { type: "Section", id: String(id) },
      ],
    }),

    // Delete a section by ID (DELETE)
    deleteSection: builder.mutation({
      query: (id) => ({
        url: `/exam/sections/delete-section/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Section", id: "LIST" },
        { type: "Section", id: String(id) },
      ],
    }),
  }),
});

// Auto-generated hooks for use in your components
export const {
  useCreateSectionMutation,
  useGetAllSectionsQuery,
  useGetSectionByIdQuery,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} = sectionApi;
