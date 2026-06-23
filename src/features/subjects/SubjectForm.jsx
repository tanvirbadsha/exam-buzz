"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { SUBJECT_STATUS_OPTIONS } from "@/lib/subjectData";
import { FileText, Image as ImageIcon, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { HierarchicalSubjectDropdown } from "./HierarchicalSubjectDropdown";
import { SubjectIcon } from "./SubjectIcon";

export const ROOT_SUBJECT_VALUE = "__root__";

const statusOptions = SUBJECT_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptySubject = {
  name: "",
  icon: "",
  parentId: ROOT_SUBJECT_VALUE,
  status: "active",
};

function buildInitialForm(subject, defaultParentId) {
  if (!subject) {
    return {
      ...emptySubject,
      parentId: defaultParentId || ROOT_SUBJECT_VALUE,
    };
  }

  return {
    ...emptySubject,
    ...subject,
    parentId: subject.parentId || ROOT_SUBJECT_VALUE,
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Subject name is required." };
  }

  if (!form.icon.trim()) {
    errors.icon = { message: "Subject icon is required." };
  }

  return errors;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SubjectForm({
  defaultParentId,
  onSubmit,
  parentOptions,
  secondaryAction,
  subject,
  submitLabel = "Save subject",
}) {
  const initialForm = useMemo(
    () => buildInitialForm(subject, defaultParentId),
    [defaultParentId, subject],
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleIconUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        icon: { message: "Upload an image file for the icon." },
      }));
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        icon: { message: "Icon image must be 1MB or smaller." },
      }));
      return;
    }

    try {
      const icon = await readImageFile(file);
      updateField("icon", icon);
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        icon: { message: "Icon could not be loaded." },
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...form,
      parentId: form.parentId === ROOT_SUBJECT_VALUE ? null : form.parentId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="grid gap-4">
        <TextInput
          label="Subject name"
          name="name"
          icon={FileText}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Mathematics"
        />

        <div className="field-group">
          <span className="field-label">Icon</span>
          <div
            className={`rounded-lg border bg-surface p-3 ${
              errors.icon ? "border-rose-300" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <SubjectIcon
                icon={form.icon}
                name={form.name}
                className="h-14 w-14 text-sm"
              />
              <div className="min-w-0 flex-1">
                <label className="button button-secondary inline-flex min-h-10 cursor-pointer">
                  <Upload size={16} />
                  Upload icon
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleIconUpload}
                  />
                </label>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <ImageIcon size={13} />
                  PNG, JPG, SVG, or WebP. Max 1MB.
                </p>
              </div>
            </div>
          </div>
          {errors.icon && (
            <span className="field-error" role="alert">
              {errors.icon.message}
            </span>
          )}
        </div>

        <HierarchicalSubjectDropdown
          label="Parent subject"
          options={parentOptions}
          value={form.parentId}
          onChange={(option) => updateField("parentId", option.value)}
          placeholder="Top-level subject"
          searchPlaceholder="Search subjects..."
        />

        <CustomDropdown
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(option) => updateField("status", option.value)}
          placeholder="Select status"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button type="submit" className="button button-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
