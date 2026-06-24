"use client";

import { LoaderCircle } from "lucide-react";

export function GlobalSpinner({
  label = "Loading...",
  className = "",
  compact = false,
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm font-semibold text-muted ${compact ? "py-2" : "min-h-56 py-10"} ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-brand-strong" />
      <span>{label}</span>
    </div>
  );
}
