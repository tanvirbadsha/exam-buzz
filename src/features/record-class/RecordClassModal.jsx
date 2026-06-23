"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { RecordClassForm } from "./RecordClassForm";

export function RecordClassModal({
  categoryIndex,
  categoryOptions,
  isOpen,
  mode,
  recordClass,
  subjectIndex,
  topicsBySubjectId,
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

  const title =
    mode === "edit" ? "Edit recorded class" : "Add recorded class";
  const submitLabel = mode === "edit" ? "Save changes" : "Add recorded class";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-class-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close recorded class modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="record-class-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select the category, optional exam, publish time, and YouTube
              video link.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close recorded class modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <RecordClassForm
            categoryIndex={categoryIndex}
            categoryOptions={categoryOptions}
            recordClass={recordClass}
            subjectIndex={subjectIndex}
            topicsBySubjectId={topicsBySubjectId}
            submitLabel={submitLabel}
            onSubmit={(recordClassInput) => {
              onSubmit(recordClassInput);
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
