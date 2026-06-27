"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { FolderForm } from "./FolderForm";

export function FolderModal({
  isOpen,
  mode = "create",
  folder,
  folders = [],
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title =
    mode === "edit" ? "Edit folder" : mode === "view" ? "View folder" : "Create folder";
  const submitLabel = mode === "edit" ? "Save changes" : "Create folder";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close folder modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="folder-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === "view"
                ? "Folder details at a glance."
                : mode === "edit"
                  ? "Update folder details below."
                  : "Add a new folder to organize content."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close folder modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <FolderForm
            folders={folders}
            folder={folder}
            mode={mode}
            submitLabel={submitLabel}
            onSubmit={(folderInput) => {
              onSubmit(folderInput);
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
