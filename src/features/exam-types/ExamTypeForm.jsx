"use client";

import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import { isExamTypeIconImage } from "@/lib/examTypeData";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

const emptyExamType = {
  name: "",
  icon: "",
};

function buildInitialForm(examType) {
  if (!examType) return emptyExamType;

  return {
    name: examType.name || "",
    icon: examType.icon || "",
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Exam type name is required." };
  }

  return errors;
}

export function ExamTypeForm({
  examType,
  onSubmit,
  secondaryAction,
  submitLabel = "Save exam type",
}) {
  const initialForm = useMemo(() => buildInitialForm(examType), [examType]);
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

  const handleIconChange = (event) => {
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("icon", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      icon: form.icon.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4">
        <TextInput
          label="Exam type name"
          name="name"
          icon={FileText}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Preliminary"
        />

        <FileUpload
          label="Icon"
          name="icon"
          accept=".jpg,.jpeg,.png,.webp,.svg"
          existingUrl={isExamTypeIconImage(form.icon) ? form.icon : ""}
          existingFileName={
            isExamTypeIconImage(form.icon) ? `${form.name || "Exam type"} icon` : ""
          }
          uploadHint="SVG, PNG, JPG, or WebP. Max 1MB."
          onChange={handleIconChange}
          onRemoveExisting={() => updateField("icon", "")}
          error={errors.icon}
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
