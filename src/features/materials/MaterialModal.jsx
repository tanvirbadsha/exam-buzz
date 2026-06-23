"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { MaterialForm } from "./MaterialForm";

export function MaterialModal({
  categoryIndex,
  categoryOptions,
  isOpen,
  material,
  materialFolderOptions,
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

  const title = mode === "edit" ? "Edit material" : "Add material";
  const submitLabel = mode === "edit" ? "Save changes" : "Upload material";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close material modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="material-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select the category, exam, folder, and upload a PDF or image.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close material modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <MaterialForm
            categoryIndex={categoryIndex}
            categoryOptions={categoryOptions}
            material={material}
            materialFolderOptions={materialFolderOptions}
            submitLabel={submitLabel}
            onSubmit={(materialInput) => {
              onSubmit(materialInput);
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
