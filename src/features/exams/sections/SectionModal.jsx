"use client";

import { TextInput } from "@/components/ui/forms/TextInput";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { BookOpenCheck, FileText, Hash, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptySection = {
  examID: "",
  name: "",
  maxPapers: "",
};

function buildInitialForm(section) {
  if (!section) return emptySection;

  return {
    examID: section.examID ?? section.examId ?? "",
    name: section.name || "",
    maxPapers: String(section.maxPapers || ""),
  };
}

function buildErrors(form, examIds) {
  const errors = {};
  const maxPapers = Number(form.maxPapers);

  if (!form.examID || !examIds.has(String(form.examID))) {
    errors.examID = { message: "Select a valid exam." };
  }

  if (!form.name.trim()) {
    errors.name = { message: "Section name is required." };
  }

  if (!Number.isInteger(maxPapers) || maxPapers < 1) {
    errors.maxPapers = { message: "Max paper count must be at least 1." };
  }

  return errors;
}

function SectionModalForm({
  examOptions,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
  section,
}) {
  const initialForm = useMemo(() => buildInitialForm(section), [section]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const examIds = useMemo(
    () => new Set(examOptions.map((option) => String(option.value))),
    [examOptions],
  );
  const isEditMode = mode === "edit";

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form, examIds);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const shouldClose = await onSubmit({
      examID: form.examID,
      name: form.name.trim(),
      maxPapers: Number(form.maxPapers),
    });

    if (shouldClose !== false) {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid gap-4">
        <HierarchicalCategoryDropdown
          label="Exam"
          icon={BookOpenCheck}
          options={examOptions}
          value={form.examID}
          onChange={(option) => updateField("examID", option.value)}
          placeholder="Select exam"
          searchPlaceholder="Search exams..."
          emptyText="No exams found."
          error={errors.examID}
        />

        <TextInput
          label="Section name"
          name="section-name"
          icon={FileText}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Paper Section A"
        />

        <TextInput
          label="Max paper count"
          name="section-max-papers"
          icon={Hash}
          type="number"
          min="1"
          step="1"
          value={form.maxPapers}
          onChange={(event) => updateField("maxPapers", event.target.value)}
          error={errors.maxPapers}
          placeholder="3"
        />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="button button-secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isEditMode
              ? "Saving..."
              : "Creating..."
            : isEditMode
              ? "Save changes"
              : "Create section"}
        </button>
      </div>
    </form>
  );
}

export function SectionModal({
  examOptions,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
  section,
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

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit section" : "Create section";
  const formKey = `${mode}-${section?.id || "new"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close section modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="section-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select an exam and define how many papers the section can hold.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close section modal"
          >
            <X size={18} />
          </button>
        </div>

        <SectionModalForm
          key={formKey}
          examOptions={examOptions}
          isSubmitting={isSubmitting}
          mode={mode}
          onClose={onClose}
          onSubmit={onSubmit}
          section={section}
        />
      </div>
    </div>
  );
}
