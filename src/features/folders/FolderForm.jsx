"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  buildParentFolderOptions,
  formatDateTime,
  getParentName,
} from "@/lib/folderData";

const emptyFolder = {
  name: "",
  parentId: null,
  isActive: true,
};

function buildErrors(form) {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = { message: "Folder name is required." };
  }
  return errors;
}

export function FolderForm({
  folder,
  folders,
  mode = "create",
  onSubmit,
  secondaryAction,
  submitLabel = "Create folder",
}) {
  const initialForm = useMemo(
    () => ({ ...emptyFolder, ...folder }),
    [folder],
  );
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const parentFolderOptions = useMemo(
    () => buildParentFolderOptions(folders || [], mode === "edit" ? folder?.id : null),
    [folders, folder, mode],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      name: form.name.trim(),
      parentId: form.parentId || null,
      isActive: form.isActive,
    });
  };

  const isViewMode = mode === "view";

  const parentLabel = isViewMode && folder
    ? getParentName(folders || [], folder.parentId)
    : form.parentId
      ? parentFolderOptions.find((o) => o.value === form.parentId)?.label || "Select parent"
      : "None (root folder)";

  const parentNameForView = isViewMode && folder
    ? getParentName(folders || [], folder.parentId)
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Folder name"
          name="name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          error={errors.name}
          placeholder="Enter folder name"
          disabled={isViewMode}
        />
        <div>
          {isViewMode ? (
            <div>
              <span className="field-label">Parent folder</span>
              <div className="mt-1.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground">
                {parentNameForView}
              </div>
            </div>
          ) : (
            <CustomDropdown
              label="Parent folder"
              options={parentFolderOptions}
              value={{ label: parentLabel, value: form.parentId || "" }}
              onChange={(option) => updateField("parentId", option.value)}
              disabled={isViewMode}
              placeholder="None (root folder)"
            />
          )}
        </div>
      </div>

      {(mode === "create" || mode === "view") && (
        <div className={mode === "view" ? "" : "grid gap-4 md:grid-cols-2"}>
          <div className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 ${mode === "view" ? "md:col-span-1" : ""}`}>
            <StatusToggle
              checked={form.isActive}
              label={form.isActive ? "Active" : "Inactive"}
              onChange={(next) => updateField("isActive", next)}
              disabled={isViewMode}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {form.isActive ? "Active" : "Inactive"}
              </p>
              <p className="text-xs text-muted">Folder visibility status</p>
            </div>
          </div>
        </div>
      )}

      {isViewMode && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-xs font-semibold text-muted">Created at</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDateTime(folder?.createdAt)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-xs font-semibold text-muted">Updated at</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDateTime(folder?.updatedAt)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        {!isViewMode && (
          <button type="submit" className="button button-primary">
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
