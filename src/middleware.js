import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE_NAME,
  LOGIN_REDIRECT,
  PUBLIC_ROUTES,
} from "./lib/auth/constants";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL(LOGIN_REDIRECT, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
