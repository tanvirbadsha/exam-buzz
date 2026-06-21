"use client";

import { Activity, LoaderCircle, WifiOff } from "lucide-react";
import { useHealthCheckQuery } from "@/store/apiSlice";

export function ApiStatusBadge() {
  const { isError, isFetching, isSuccess } = useHealthCheckQuery();

  if (isFetching) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
        <LoaderCircle size={14} className="animate-spin" />
        Checking API
      </span>
    );
  }

  if (isError) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
        <WifiOff size={14} />
        API offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
      <Activity size={14} />
      {isSuccess ? "API connected" : "API ready"}
    </span>
  );
}
