"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  ROUTINE_STATUS_OPTIONS,
  ROUTINE_TYPES,
  getRoutineTypeMeta,
} from "@/lib/classRoutineData";

const emptyRoutine = {
  examType: "preliminary",
  title: "",
  status: "active",
  fileName: "",
  fileUrl: "",
  fileSize: 0,
};

function buildInitialForm(routine, examType) {
  const selectedType = routine?.examType || examType || "preliminary";
  return {
    ...emptyRoutine,
    examType: selectedType,
    title: routine?.title || getRoutineTypeMeta(selectedType).label,
    status: routine?.status || "active",
    fileName: routine?.fileName || "",
    fileUrl: routine?.fileUrl || "",
    fileSize: routine?.fileSize || 0,
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.examType) {
    errors.examType = { message: "Exam type is required." };
  }

  if (!form.title.trim()) {
    errors.title = { message: "Title is required." };
  }

  if (!form.fileUrl) {
    errors.file = { message: "PDF routine file is required." };
  }

  return errors;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ClassRoutineForm({
  examType,
  mode,
  onSubmit,
  routine,
  secondaryAction,
  submitLabel = "Save routine",
}) {
  const initialForm = useMemo(
    () => buildInitialForm(routine, examType),
    [examType, routine],
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isReadingFile, setIsReadingFile] = useState(false);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleExamTypeChange = (option) => {
    setForm((currentForm) => ({
      ...currentForm,
      examType: option.value,
      title:
        currentForm.title && currentForm.title !== getRoutineTypeMeta(currentForm.examType).label
          ? currentForm.title
          : getRoutineTypeMeta(option.value).label,
    }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.examType;
      return nextErrors;
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: { message: "Only PDF files are allowed." },
      }));
      event.target.value = "";
      return;
    }

    setIsReadingFile(true);
    try {
      const fileUrl = await readFileAsDataUrl(file);
      setForm((currentForm) => ({
        ...currentForm,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
      }));
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.file;
        return nextErrors;
      });
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <CustomDropdown
          label="Exam type"
          options={ROUTINE_TYPES}
          value={form.examType}
          onChange={handleExamTypeChange}
          error={errors.examType}
          placeholder="Select exam type"
          disabled={mode === "edit"}
        />
        <CustomDropdown
          label="Status"
          options={ROUTINE_STATUS_OPTIONS}
          value={form.status}
          onChange={(option) => updateField("status", option.value)}
          placeholder="Select status"
        />
      </div>

      <TextInput
        label="Title"
        name="title"
        icon={FileText}
        value={form.title}
        onChange={(event) => updateField("title", event.target.value)}
        error={errors.title}
        placeholder="Preliminary exam routine"
      />

      <div className="field-group">
        <label htmlFor="routine-file" className="field-label">
          PDF file
        </label>
        <div
          className={`rounded-lg border border-dashed p-4 transition-colors ${
            errors.file
              ? "border-rose-400 bg-rose-50"
              : "border-border-strong bg-surface-muted"
          }`}
        >
          <input
            id="routine-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            aria-invalid={Boolean(errors.file)}
            aria-describedby={errors.file ? "routine-file-error" : undefined}
            className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-strong"
          />

          {form.fileName && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {form.fileName}
                </p>
                <p className="text-xs text-muted">
                  {isReadingFile ? "Preparing preview..." : "PDF selected"}
                </p>
              </div>
              {form.fileUrl && (
                <a
                  href={form.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary button-compact"
                >
                  Preview PDF
                </a>
              )}
            </div>
          )}
        </div>
        {errors.file && (
          <span id="routine-file-error" className="field-error" role="alert">
            {errors.file.message}
          </span>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button
          type="submit"
          className="button button-primary"
          disabled={isReadingFile}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
