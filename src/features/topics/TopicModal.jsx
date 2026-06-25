"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { HierarchicalSubjectDropdown } from "@/features/subjects/HierarchicalSubjectDropdown";
import { BookOpenText, FileText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusOptions = [
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

const emptyTopic = {
  subjectID: "",
  name: "",
  status: true,
};

function buildInitialForm(topic) {
  if (!topic) return emptyTopic;

  return {
    subjectID: topic.subjectId || topic.subjectID || "",
    name: topic.name || "",
    status:
      typeof topic.status === "boolean"
        ? topic.status
        : topic.status !== "inactive",
  };
}

function buildErrors(form, subjectIds) {
  const errors = {};

  if (!form.subjectID || !subjectIds.has(form.subjectID)) {
    errors.subjectID = { message: "Select a valid subject." };
  }

  if (!form.name.trim()) {
    errors.name = { message: "Topic name is required." };
  }

  return errors;
}

function TopicModalForm({
  mode,
  onClose,
  onSubmit,
  subjectOptions,
  topic,
}) {
  const initialForm = useMemo(() => buildInitialForm(topic), [topic]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const isEditMode = mode === "edit";
  const subjectIds = useMemo(
    () => new Set(subjectOptions.map((option) => option.value)),
    [subjectOptions],
  );

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form, subjectIds);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const topicInput = {
      subjectID: form.subjectID,
      name: form.name.trim(),
    };

    if (!isEditMode) {
      topicInput.status = form.status;
    }

    onSubmit(topicInput);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid gap-4">
        <HierarchicalSubjectDropdown
          label="Subject"
          icon={BookOpenText}
          options={subjectOptions}
          value={form.subjectID}
          onChange={(option) => updateField("subjectID", option.value)}
          placeholder="Select subject"
          searchPlaceholder="Search subjects..."
          emptyText="No subjects found."
          error={errors.subjectID}
        />

        <TextInput
          label="Topic name"
          name="topic-name"
          icon={FileText}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Grammar"
        />

        {!isEditMode && (
          <CustomDropdown
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(option) => updateField("status", option.value)}
            placeholder="Select status"
          />
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="button button-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button type="submit" className="button button-primary">
          {isEditMode ? "Save changes" : "Create topic"}
        </button>
      </div>
    </form>
  );
}

export function TopicModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  subjectOptions,
  topic,
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
  const title = isEditMode ? "Edit topic" : "Create topic";
  const formKey = `${mode}-${topic?.id || "new"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close topic modal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="topic-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose the subject and keep topic names clear for exam setup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button h-9 w-9"
            aria-label="Close topic modal"
          >
            <X size={18} />
          </button>
        </div>

        <TopicModalForm
          key={formKey}
          mode={mode}
          onClose={onClose}
          onSubmit={onSubmit}
          subjectOptions={subjectOptions}
          topic={topic}
        />
      </div>
    </div>
  );
}
