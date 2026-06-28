"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CreateExamBtn({ label = "Create exam" }) {
  const pathname = usePathname();

  // Determine the correct creation URL based on the current pathname
  let createHref = "/exams"; // Fallback path

  if (pathname?.includes("/written-exams")) {
    createHref = "/exams/written-exams/create";
  } else if (pathname?.includes("/mcq-exams")) {
    createHref = "/exams/mcq-exams/create";
  }

  return (
    <Link
      href={createHref}
      className="button button-primary min-h-11 md:self-end flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
    >
      <Plus size={16} />
      <span>{label}</span>
    </Link>
  );
}
