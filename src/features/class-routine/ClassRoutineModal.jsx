"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { ClassRoutineForm } from "./ClassRoutineForm";

export function ClassRoutineModal({
  examType,
  isOpen,
  mode,
  onClose,
  onSubmit,
  routine,
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

  const title = mode === "edit" ? "Edit routine" : "Upload routine";
  const submitLabel = mode === "edit" ? "Update routine" : "Add routine";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-routine-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close routine modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="class-routine-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Upload a PDF routine and choose whether it is visible to students.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close routine modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <ClassRoutineForm
            examType={examType}
            mode={mode}
            routine={routine}
            submitLabel={submitLabel}
            onSubmit={(routineInput) => {
              onSubmit(routineInput);
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
