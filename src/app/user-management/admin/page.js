import { cookies } from "next/headers";
import AdminTableClient from "@/app/user-management/admin/AdminTableClient";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

const FIRST_ADMIN_PAGE = 1;
const ADMIN_PAGE_LIMIT = 10;

function emptyAdminResponse(message) {
  return {
    status: 500,
    message,
    admins: [],
    pagination: {
      total: 0,
      page: FIRST_ADMIN_PAGE,
      limit: ADMIN_PAGE_LIMIT,
      totalPages: 0,
    },
    _error: true,
  };
}

async function getInitialAdmins() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return emptyAdminResponse("NEXT_PUBLIC_BASE_URL is not configured.");
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const url = new URL("/auth/admin/get-all-admins", baseUrl);

    url.searchParams.set("page", String(FIRST_ADMIN_PAGE));
    url.searchParams.set("limit", String(ADMIN_PAGE_LIMIT));

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(process.env.NEXT_PUBLIC_BASE_API_KEY
          ? { "x-api-key": process.env.NEXT_PUBLIC_BASE_API_KEY }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return emptyAdminResponse(
        data?.message || `Admin request failed with ${response.status}.`,
      );
    }

    return data;
  } catch (error) {
    return emptyAdminResponse(
      error instanceof Error ? error.message : "Unable to load admins.",
    );
  }
}

export default async function AdminManagementPage() {
  const initialData = await getInitialAdmins();

  return <AdminTableClient initialData={initialData} />;
}
