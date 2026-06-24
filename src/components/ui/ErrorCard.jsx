"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export function ErrorCard({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div
      className={`mx-auto w-full max-w-3xl rounded-lg border border-rose-200 bg-rose-50 px-5 py-6 text-rose-950 ${className}`}
      role="alert"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-danger shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            className="button button-secondary shrink-0 bg-white"
            onClick={onRetry}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
