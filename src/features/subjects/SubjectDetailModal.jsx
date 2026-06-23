"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { SubjectIcon } from "./SubjectIcon";

export function SubjectDetailModal({
  childCount,
  isOpen,
  onClose,
  parent,
  subject,
  topicCount,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !subject) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-detail-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close subject details"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="subject-detail-title"
              className="text-lg font-bold text-foreground"
            >
              {subject.name}
            </h2>
            <p className="mt-1 text-sm text-muted">Subject details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close subject details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-4">
            <SubjectIcon
              icon={subject.icon}
              name={subject.name}
              className="h-11 w-11 text-sm"
            />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{subject.name}</p>
              <p className="mt-1 text-sm text-muted">
                {parent ? `Under ${parent.name}` : "Top-level subject"}
              </p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs font-semibold text-muted">Status</dt>
              <dd className="mt-1 text-sm font-bold capitalize text-foreground">
                {subject.status}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs font-semibold text-muted">Sub-subjects</dt>
              <dd className="mt-1 text-sm font-bold text-foreground">
                {childCount}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs font-semibold text-muted">Topics</dt>
              <dd className="mt-1 text-sm font-bold text-foreground">
                {topicCount}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
