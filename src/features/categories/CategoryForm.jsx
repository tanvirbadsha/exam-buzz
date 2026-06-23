"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  CATEGORY_STATUS_OPTIONS,
  createCategorySlug,
} from "@/lib/categoryData";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { HierarchicalCategoryDropdown } from "./HierarchicalCategoryDropdown";

export const ROOT_PARENT_VALUE = "__root__";

const statusOptions = CATEGORY_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  parentId: ROOT_PARENT_VALUE,
  status: "active",
  examCount: 0,
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
    ...category,
    parentId: category.parentId || ROOT_PARENT_VALUE,
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

  const handleNameChange = (event) => {
    const name = event.target.value;
    setForm((currentForm) => ({
      ...currentForm,
      name,
      slug:
        currentForm.slug && category
          ? currentForm.slug
          : createCategorySlug(name),
    }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.name;
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
      parentId: form.parentId === ROOT_PARENT_VALUE ? null : form.parentId,
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
          onChange={handleNameChange}
          error={errors.name}
          placeholder="BCS Preliminary"
        />

        <HierarchicalCategoryDropdown
          label="Parent category"
          options={parentOptions}
          value={form.parentId}
          onChange={(option) => updateField("parentId", option.value)}
          placeholder=""
          searchPlaceholder="Search categories..."
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
