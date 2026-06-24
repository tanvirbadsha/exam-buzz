"use client";

import { Activity } from "lucide-react";

export function ApiStatusBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
      <Activity size={14} />
      API ready
    </span>
  );
}
