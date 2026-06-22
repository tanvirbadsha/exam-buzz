"use client";

import {
  BadgeDollarSign,
  CalendarDays,
  Image,
  Link as LinkIcon,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  PACKAGE_STATUS_OPTIONS,
  PACKAGE_TYPE_OPTIONS,
} from "@/lib/packageInfoData";

const statusOptions = PACKAGE_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyPackage = {
  title: "",
  price: 0,
  currency: "BDT",
  validityDays: 60,
  status: "active",
  packageType: "Course Base",
  packageTypeNote: "",
  totalPurchased: 0,
  totalSellAmount: 0,
  url: "",
  imageUrl: "",
  summary: "",
  rules: [],
  permissions: [],
};

function permissionsToText(permissions = []) {
  return permissions
    .map((item) => `${item.path.join(" > ")}: ${item.permission}`)
    .join("\n");
}

function buildInitialForm(packageInfo) {
  const mergedPackage = { ...emptyPackage, ...packageInfo };

  return {
    ...mergedPackage,
    rules: Array.isArray(mergedPackage.rules)
      ? mergedPackage.rules.join("\n")
      : mergedPackage.rules,
    permissions: Array.isArray(mergedPackage.permissions)
      ? permissionsToText(mergedPackage.permissions)
      : mergedPackage.permissions,
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = { message: "Package title is required." };
  }

  if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
    errors.price = { message: "Price must be 0 or more." };
  }

  if (!Number.isFinite(Number(form.validityDays)) || Number(form.validityDays) < 0) {
    errors.validityDays = { message: "Validity must be 0 or more." };
  }

  if (form.url && !/^https?:\/\/.+/i.test(form.url)) {
    errors.url = { message: "Enter a valid http or https URL." };
  }

  if (form.imageUrl && !/^https?:\/\/.+/i.test(form.imageUrl)) {
    errors.imageUrl = { message: "Enter a valid image URL." };
  }

  return errors;
}

export function PackageInfoForm({
  packageInfo,
  onSubmit,
  secondaryAction,
  submitLabel = "Save package",
}) {
  const initialForm = useMemo(
    () => buildInitialForm(packageInfo),
    [packageInfo],
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

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Package title"
          name="title"
          icon={Package}
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={errors.title}
          placeholder="Officer cash batch"
        />
        <TextInput
          label="Price"
          name="price"
          type="number"
          min="0"
          icon={BadgeDollarSign}
          value={form.price}
          onChange={(event) => updateField("price", event.target.value)}
          error={errors.price}
          placeholder="397"
        />
        <TextInput
          label="Validity days"
          name="validityDays"
          type="number"
          min="0"
          icon={CalendarDays}
          value={form.validityDays}
          onChange={(event) =>
            updateField("validityDays", event.target.value)
          }
          error={errors.validityDays}
          placeholder="60"
        />
        <CustomDropdown
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(option) => updateField("status", option.value)}
          placeholder="Select status"
        />
        <CustomDropdown
          label="Package type"
          options={PACKAGE_TYPE_OPTIONS}
          value={form.packageType}
          onChange={(option) => updateField("packageType", option.value)}
          placeholder="Select package type"
        />
        <TextInput
          label="Package type note"
          name="packageTypeNote"
          icon={ReceiptText}
          value={form.packageTypeNote}
          onChange={(event) =>
            updateField("packageTypeNote", event.target.value)
          }
          placeholder="Package without any limited exam"
        />
        <TextInput
          label="Total purchased"
          name="totalPurchased"
          type="number"
          min="0"
          icon={Users}
          value={form.totalPurchased}
          onChange={(event) =>
            updateField("totalPurchased", event.target.value)
          }
          placeholder="28"
        />
        <TextInput
          label="Total sell amount"
          name="totalSellAmount"
          type="number"
          min="0"
          icon={ShoppingBag}
          value={form.totalSellAmount}
          onChange={(event) =>
            updateField("totalSellAmount", event.target.value)
          }
          placeholder="10588"
        />
        <TextInput
          label="Access URL"
          name="url"
          icon={LinkIcon}
          value={form.url}
          onChange={(event) => updateField("url", event.target.value)}
          error={errors.url}
          placeholder="https://t.me/..."
        />
        <TextInput
          label="Image URL"
          name="imageUrl"
          icon={Image}
          value={form.imageUrl}
          onChange={(event) => updateField("imageUrl", event.target.value)}
          error={errors.imageUrl}
          placeholder="https://..."
        />
      </div>

      <div className="field-group">
        <label htmlFor="summary" className="field-label">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          value={form.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand-soft"
          placeholder="Short package overview"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="field-group">
          <label htmlFor="rules" className="field-label">
            Rules
          </label>
          <textarea
            id="rules"
            name="rules"
            rows={7}
            value={form.rules}
            onChange={(event) => updateField("rules", event.target.value)}
            className="min-h-40 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand-soft"
            placeholder="One rule per line"
          />
          <span className="text-xs text-muted">One condition per line.</span>
        </div>
        <div className="field-group">
          <label htmlFor="permissions" className="field-label">
            Exams and permissions
          </label>
          <textarea
            id="permissions"
            name="permissions"
            rows={7}
            value={form.permissions}
            onChange={(event) =>
              updateField("permissions", event.target.value)
            }
            className="min-h-40 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand-soft"
            placeholder="BCS > Written: Included"
          />
          <span className="text-xs text-muted">
            Use &quot;Category &gt; Exam: Permission&quot; or paste columns separated
            by multiple spaces.
          </span>
        </div>
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
