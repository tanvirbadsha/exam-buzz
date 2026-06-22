"use client";

import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import Tiptap from "@/components/text-editor/Tiptap";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { NOTICE_STATUS_OPTIONS } from "@/lib/noticeBoardData";

const statusOptions = NOTICE_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyNotice = {
  title: "",
  description: "<p></p>",
  status: "active",
};

function buildInitialForm(notice) {
  return { ...emptyNotice, ...notice };
}

function buildErrors(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = { message: "Notice title is required." };
  }

  return errors;
}

export function NoticeBoardForm({
  notice,
  onSubmit,
  secondaryAction,
  submitLabel = "Save notice",
}) {
  const initialForm = useMemo(() => buildInitialForm(notice), [notice]);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <TextInput
          label="Title"
          name="title"
          icon={FileText}
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={errors.title}
          placeholder="Exam routine update"
        />
        <CustomDropdown
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(option) => updateField("status", option.value)}
          placeholder="Select status"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Description</label>
        <Tiptap
          ariaLabel="Notice description editor"
          value={form.description}
          onChange={(html) => updateField("description", html)}
          minHeight={260}
          placeholder="Write the notice users will see in the mobile app..."
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
