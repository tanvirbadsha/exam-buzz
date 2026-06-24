"use client";

import { Bell, ChevronRight, LogOut, Menu, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLogoutMutation } from "@/features/auth/api/authApi";
import { LOGIN_TOAST_KEY } from "@/lib/auth";

export function Header({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const pathSegments = pathname.split("/").filter(Boolean);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      window.sessionStorage.removeItem(LOGIN_TOAST_KEY);
      toast.success("Signed out.");
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-button h-10 w-10 border border-border"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <ShieldCheck size={17} />
          </span>
          Exam Buzz
        </Link>
      </div>

      <div className="hidden items-center gap-2 text-sm font-medium md:flex">
        <span className="text-muted">Exam Buzz</span>
        <ChevronRight size={14} className="text-border-strong" />
        {pathSegments.length === 0 ? (
          <span className="font-semibold text-foreground">Dashboard</span>
        ) : (
          pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const cleanLabel = segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={`${segment}-${index}`}
                className="flex items-center gap-2"
              >
                <span
                  className={
                    isLast ? "font-semibold text-foreground" : "text-muted"
                  }
                >
                  {cleanLabel}
                </span>
                {!isLast && (
                  <ChevronRight size={14} className="text-slate-300" />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <button
          type="button"
          className="icon-button relative rounded-full"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white"></span>
        </button>

        <div className="mx-1 hidden h-8 w-px bg-border sm:block"></div>

        <div className="hidden items-center gap-3 rounded-xl py-1.5 pl-2 pr-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-muted text-muted">
            <User size={18} />
          </div>
          <div className="hidden text-left lg:block">
            <div className="text-xs font-semibold leading-tight text-foreground">
              Tanvir Badsha
            </div>
            <div className="text-[10px] leading-tight text-muted">
              Super Admin
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="button ml-1 min-h-9 px-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          <span className="hidden text-xs font-semibold lg:block">
            Sign Out
          </span>
        </button>
      </div>
    </header>
  );
}
