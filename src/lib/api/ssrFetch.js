import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * SERVER-ONLY helper for backend requests from Server Components.
 *
 * USAGE EXAMPLES:
 * const data = await ssrFetch("/api/students");
 * const item = await ssrFetch("/api/students/123");
 * const result = await ssrFetch("/api/students", { method: "POST", body: JSON.stringify(payload) });
 * const cached = await ssrFetch("/api/config", { cache: "force-cache" });
 */
export async function ssrFetch(endpoint, options = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const apiKey = process.env.BASE_API_KEY || process.env.NEXT_PUBLIC_BASE_API_KEY;
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  const headers = {
    "Content-Type": "application/json",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    Cookie: cookieHeader,
    ...options.headers,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    throw {
      status: response.status,
      message: await response.text(),
    };
  }

  return response.json();
}
