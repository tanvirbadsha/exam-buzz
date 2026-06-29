"use client";

import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { useGetAdminProfileQuery } from "@/features/auth/api/authApi";
import { LOGIN_REDIRECT, PUBLIC_ROUTES } from "@/lib/auth/constants";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname);
}

export default function AuthInitializer({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldSkipProfileCheck = isPublicRoute(pathname);
  const {
    error,
    isError,
    isLoading,
    isUninitialized,
  } = useGetAdminProfileQuery(undefined, {
    skip: shouldSkipProfileCheck,
  });

  useEffect(() => {
    if (shouldSkipProfileCheck || !isError) return;

    const loginUrl = new URL(LOGIN_REDIRECT, window.location.origin);
    const callbackUrl = `${window.location.pathname}${window.location.search}`;

    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    router.replace(loginUrl.toString());
  }, [isError, router, shouldSkipProfileCheck]);

  if (shouldSkipProfileCheck) {
    return children;
  }

  if (isLoading || isUninitialized) {
    return (
      <main className="min-h-dvh bg-app text-foreground">
        <GlobalSpinner label="Checking admin session..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-app text-foreground">
        <GlobalSpinner label="Redirecting to login..." />
      </main>
    );
  }

  return children;
}
