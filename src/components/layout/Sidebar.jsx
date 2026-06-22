"use client";

import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  PackageCheck,
  Settings,
  ShieldAlert,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Exams",
    icon: BookOpenCheck,
    isDropdown: true,
    children: [
      { label: "All Exams", href: "/exams" },
      { label: "Question Bank", href: "/exams/questions" },
      { label: "Results", href: "/exams/results" },
    ],
  },
  {
    label: "Courses",
    icon: GraduationCap,
    href: "/courses",
  },
  {
    label: "Package Info",
    icon: PackageCheck,
    href: "/packages",
  },
  {
    label: "Users",
    icon: Users,
    isDropdown: true,
    children: [
      { label: "Admin", href: "/user-management/admin" },
      { label: "Teacher", href: "/user-management/teacher" },
      { label: "Students", href: "/user-management/students" },
    ],
  },
  {
    label: "Roles & Access",
    icon: UserRoundCog,
    href: "/roles",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

function SidebarContent({ onClose }) {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (label, isOpen) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !isOpen }));
  };

  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent font-black text-sidebar">
          <ShieldAlert size={18} />
        </div>
        <span className="min-w-0 flex-1 text-lg font-bold tracking-wide text-white">
          Exam <span className="text-brand-accent">Buzz</span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9 text-white hover:bg-white/10 md:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.isDropdown) {
            const isChildActive = item.children?.some(
              (child) => pathname === child.href,
            );
            const isOpen = openDropdowns[item.label] ?? Boolean(isChildActive);

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleDropdown(item.label, isOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200
                    ${
                      isChildActive
                        ? "bg-white/10 text-brand-accent"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${isChildActive ? "text-brand-accent" : "text-slate-300 group-hover:text-white"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-9 space-y-1 mt-1 border-l border-white/10 ml-6">
                    {item.children?.map((child) => {
                      const isSubActive =
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`block px-4 py-2 text-xs font-medium rounded-lg transition-colors
                            ${
                              isSubActive
                                ? "bg-white/10 font-semibold text-brand-accent"
                                : "text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200
                ${
                  isActive
                    ? "bg-brand-accent font-semibold text-sidebar shadow-md shadow-black/10"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-sidebar" : "text-slate-300 group-hover:text-white"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ isOpen = false, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
          aria-label="Close navigation overlay"
        />
      )}

      <aside className="hidden h-dvh min-h-0 w-64 shrink-0 flex-col border-r border-white/10 bg-sidebar text-slate-200 md:flex">
        <SidebarContent />
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-white/10 bg-sidebar text-slate-200 shadow-2xl transition-transform duration-200 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}
