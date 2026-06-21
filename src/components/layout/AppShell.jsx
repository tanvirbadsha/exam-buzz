"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { LOGIN_TOAST_KEY } from "@/lib/auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    const shouldShowLoginToast =
      window.sessionStorage.getItem(LOGIN_TOAST_KEY) === "1";

    if (!shouldShowLoginToast) return;

    window.sessionStorage.removeItem(LOGIN_TOAST_KEY);
    toast.success("Logged in as Super Admin.");
  }, [isLoginPage]);

  if (isLoginPage) {
    return <main className="min-h-dvh bg-app text-foreground">{children}</main>;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-app text-foreground">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
