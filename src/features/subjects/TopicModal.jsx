"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { SUBJECT_STATUS_OPTIONS } from "@/lib/subjectData";
import { FileText, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const statusOptions = SUBJECT_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyTopicRow = {
  name: "",
  status: "active",
};

function buildInitialRows(topic) {
  if (!topic) return [{ ...emptyTopicRow }];

  return [
    {
      name: topic.name || "",
      status: topic.status || "active",
    },
  ];
}

function TopicModalForm({ mode, onClose, onSubmit, subject, topic }) {
  const initialRows = useMemo(() => buildInitialRows(topic), [topic]);
  const [rows, setRows] = useState(initialRows);
  const [errors, setErrors] = useState({});
  const rowInputRefs = useRef([]);
  const createButtonRef = useRef(null);
  const isEditMode = mode === "edit";

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[index];
      return nextErrors;
    });
  };

  const addRow = ({ focusNextRow = false } = {}) => {
    let nextRowIndex = 0;

    setRows((currentRows) => {
      nextRowIndex = currentRows.length;
      return [...currentRows, { ...emptyTopicRow }];
    });

    if (focusNextRow) {
      window.setTimeout(() => {
        rowInputRefs.current[nextRowIndex]?.focus();
      }, 0);
    }
  };

  const removeRow = (index) => {
    setRows((currentRows) => {
      if (currentRows.length === 1) return currentRows;
      return currentRows.filter((_, rowIndex) => rowIndex !== index);
    });
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[index];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    rows.forEach((row, index) => {
      if (!row.name.trim()) {
        nextErrors[index] = { message: "Topic name is required." };
      }
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(rows.map((row) => ({ ...row, name: row.name.trim() })));
    onClose();
  };

  const handleTopicNameKeyDown = (event, index) => {
    if (isEditMode) return;

    if (event.key === "Enter") {
      event.preventDefault();

      if (!rows[index]?.name.trim()) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          [index]: { message: "Topic name is required." },
        }));
        return;
      }

      addRow({ focusNextRow: true });
      return;
    }

    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      createButtonRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-start"
          >
            <TextInput
              ref={(node) => {
                rowInputRefs.current[index] = node;
              }}
              label={`Topic ${index + 1}`}
              name={`topic-${index}`}
              icon={FileText}
              value={row.name}
              onChange={(event) => updateRow(index, "name", event.target.value)}
              onKeyDown={(event) => handleTopicNameKeyDown(event, index)}
              error={errors[index]}
              placeholder="Algebra"
            />

            <CustomDropdown
              label="Status"
              options={statusOptions}
              value={row.status}
              onChange={(option) => updateRow(index, "status", option.value)}
              placeholder="Select status"
            />

            <button
              type="button"
              className="icon-button h-11 w-11 self-end text-danger hover:bg-rose-50"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1 || isEditMode}
              aria-label={`Remove topic ${index + 1}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
        <div>
          {!isEditMode && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => addRow({ focusNextRow: true })}
            >
              <Plus size={16} />
              Add more
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            ref={createButtonRef}
            type="submit"
            className="button button-primary"
          >
            {isEditMode ? "Save changes" : "Create topics"}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export function TopicModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  subject,
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

  if (!isOpen || !subject) return null;

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit topic" : "Add topics";
  const formKey = `${mode}-${subject.id}-${topic?.id || "new"}`;

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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-muted px-5 py-4">
          <div className="min-w-0">
            <h2
              id="topic-modal-title"
              className="text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {subject.name} topics only need a name and status.
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
          subject={subject}
          topic={topic}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
