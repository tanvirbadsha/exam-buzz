"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import { CATEGORY_STATUS_OPTIONS } from "@/lib/categoryData";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { HierarchicalCategoryDropdown } from "./HierarchicalCategoryDropdown";

export const ROOT_PARENT_VALUE = "__root__";

const statusOptions = CATEGORY_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyCategory = {
  name: "",
  parentId: ROOT_PARENT_VALUE,
  status: "active",
  icon: null,
};

function buildInitialForm(category, defaultParentId) {
  if (!category) {
    return {
      ...emptyCategory,
      parentId: defaultParentId || ROOT_PARENT_VALUE,
    };
  }

  return {
    ...emptyCategory,
    name: category.name || "",
    parentId: category.parentId || ROOT_PARENT_VALUE,
    status: category.status ? "active" : "inactive",
    icon: null,
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Category name is required." };
  }

  return errors;
}

export function CategoryForm({
  category,
  defaultParentId,
  onSubmit,
  parentOptions,
  secondaryAction,
  isSubmitting = false,
  mode = "create",
  submitLabel = "Save category",
}) {
  const initialForm = useMemo(
    () => buildInitialForm(category, defaultParentId),
    [category, defaultParentId],
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...form,
      parentID: form.parentId === ROOT_PARENT_VALUE ? null : form.parentId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="grid gap-4">
        <TextInput
          label="Category name"
          name="name"
          icon={FileText}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="BCS Preliminary"
        />

        <HierarchicalCategoryDropdown
          label="Parent category"
          options={parentOptions}
          value={form.parentId}
          onChange={(option) => updateField("parentId", option.value)}
          placeholder="No parent"
          searchPlaceholder="Search categories..."
        />

        {mode === "create" && (
          <CustomDropdown
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(option) => updateField("status", option.value)}
            placeholder="Select status"
          />
        )}

        <FileUpload
          label="Icon"
          name="icon"
          accept=".jpg,.jpeg,.png,.webp,.svg"
          existingUrl={category?.icon || ""}
          existingFileName={category?.icon ? "Current icon" : ""}
          uploadHint="JPG, PNG, WebP, or SVG"
          onChange={(event) =>
            updateField("icon", event.target.files?.[0] || null)
          }
          onRemoveExisting={() => updateField("icon", null)}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
