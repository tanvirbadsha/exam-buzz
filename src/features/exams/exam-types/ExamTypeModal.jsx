"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { ExamTypeForm } from "./ExamTypeForm";

export function ExamTypeModal({
  examType,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
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

  if (!isOpen) return null;

  const title = mode === "edit" ? "Edit exam type" : "Create exam type";
  const submitLabel = mode === "edit" ? "Save changes" : "Create exam type";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-type-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close exam type modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="exam-type-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Set the label students and admins will see across exam workflows.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close exam type modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <ExamTypeForm
            examType={examType}
            isSubmitting={isSubmitting}
            submitLabel={submitLabel}
            onSubmit={async (examTypeInput) => {
              const result = await onSubmit(examTypeInput);
              if (result !== false) {
                onClose();
              }
            }}
            secondaryAction={
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
