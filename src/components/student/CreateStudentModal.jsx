"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { StudentForm } from "./StudentForm";

export function CreateStudentModal({ isOpen, onClose, onCreate }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-student-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close create student modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="create-student-title"
              className="text-lg font-bold text-foreground"
            >
              Create student
            </h2>
            <p className="mt-1 text-sm text-muted">
              Add a student account and package summary.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close create student modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <StudentForm
            submitLabel="Create student"
            onSubmit={(studentInput) => {
              onCreate(studentInput);
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
