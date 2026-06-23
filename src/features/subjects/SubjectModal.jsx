"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { SubjectForm } from "./SubjectForm";

export function SubjectModal({
  defaultParentId,
  isOpen,
  mode,
  onClose,
  onSubmit,
  parentOptions,
  subject,
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

  const title = mode === "edit" ? "Edit subject" : "Create subject";
  const submitLabel = mode === "edit" ? "Save changes" : "Create subject";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close subject modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="subject-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Set the subject name, icon, parent relation, and status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close subject modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <SubjectForm
            defaultParentId={defaultParentId}
            parentOptions={parentOptions}
            subject={subject}
            submitLabel={submitLabel}
            onSubmit={(subjectInput) => {
              onSubmit(subjectInput);
              onClose();
            }}
            secondaryAction={
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
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
