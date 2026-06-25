"use client";

import { FolderTree, X } from "lucide-react";
import { useEffect } from "react";
import { CategoryForm } from "./CategoryForm";

function formatDate(value) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailRow({ label, value }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border bg-surface-muted px-3 py-2 sm:grid-cols-[8rem,1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-semibold text-foreground">
        {value || "N/A"}
      </dd>
    </div>
  );
}

function CategoryDetails({ category, error, isLoading, onRetry }) {
  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm font-semibold text-muted">
        Loading category...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-semibold text-rose-700">
          Category details could not be loaded.
        </p>
        {onRetry && (
          <button
            type="button"
            className="button button-secondary mt-3"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-10 text-center text-sm font-semibold text-muted">
        Category details are unavailable.
      </div>
    );
  }

  return (
    <dl className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-brand-strong">
          {category.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.icon}
              alt={`${category.name} icon`}
              className="h-full w-full object-cover"
            />
          ) : (
            <FolderTree size={22} />
          )}
        </span>
        <div className="min-w-0">
          <dt className="sr-only">Name</dt>
          <dd className="truncate text-base font-bold text-foreground">
            {category.name}
          </dd>
          <p className="mt-1 text-xs font-semibold text-muted">
            ID: {category.id}
          </p>
        </div>
      </div>

      <DetailRow label="Parent" value={category.parent?.name || "Top-level"} />
      <DetailRow
        label="Status"
        value={category.status ? "Active" : "Inactive"}
      />
      <DetailRow label="Created" value={formatDate(category.createdAt)} />
      <DetailRow label="Updated" value={formatDate(category.updatedAt)} />
    </dl>
  );
}

export function CategoryModal({
  category,
  defaultParentId,
  detailError,
  detailLoading,
  isOpen,
  isSubmitting,
  mode,
  onClose,
  onRetryDetail,
  onSubmit,
  parentOptions,
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
    mode === "view"
      ? "View category"
      : mode === "edit"
        ? "Edit category"
        : "Create category";
  const submitLabel = mode === "edit" ? "Save changes" : "Create category";
  const description =
    mode === "view"
      ? "Review the category details returned by the API."
      : mode === "edit"
        ? "Update the category name, parent relation, or icon."
        : "Set the category name, parent relation, status, and icon.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close category modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="category-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close category modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {mode === "view" ? (
            <CategoryDetails
              category={category}
              error={detailError}
              isLoading={detailLoading}
              onRetry={onRetryDetail}
            />
          ) : (
            <CategoryForm
              key={`${mode}-${category?.id || defaultParentId}`}
              category={category}
              defaultParentId={defaultParentId}
              isSubmitting={isSubmitting}
              mode={mode}
              parentOptions={parentOptions}
              submitLabel={submitLabel}
              onSubmit={async (categoryInput) => {
                const wasSuccessful = await onSubmit(categoryInput);
                if (wasSuccessful) onClose();
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
          )}
          {mode === "view" && (
            <div className="mt-5 flex justify-end border-t border-border pt-5">
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
