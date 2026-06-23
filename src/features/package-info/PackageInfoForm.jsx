"use client";

import {
  BadgeDollarSign,
  BadgePercent,
  CalendarClock,
  CalendarDays,
  Link as LinkIcon,
  Package,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import Tiptap from "@/components/text-editor/Tiptap";
import {
  PACKAGE_STATUS_OPTIONS,
  packageRulesToHtml,
} from "@/lib/packageInfoData";

const statusOptions = PACKAGE_STATUS_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyPackage = {
  title: "",
  price: 0,
  discountPrice: "",
  currency: "BDT",
  validityDays: 60,
  status: "active",
  packageType: "Course Base",
  packageTypeNote: "",
  totalPurchased: 0,
  totalSellAmount: 0,
  url: "",
  imageUrl: "",
  bannerImageUrl: "",
  iconImageUrl: "",
  publishedAt: "",
  summary: "",
  rules: [],
  rulesHtml: "<p></p>",
  permissions: [],
};

function buildInitialForm(packageInfo) {
  const mergedPackage = { ...emptyPackage, ...packageInfo };

  return {
    ...mergedPackage,
    rulesHtml:
      mergedPackage.rulesHtml || packageRulesToHtml(mergedPackage.rules),
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

  if (
    form.discountPrice !== "" &&
    (!Number.isFinite(Number(form.discountPrice)) ||
      Number(form.discountPrice) < 0)
  ) {
    errors.discountPrice = { message: "Discount price must be 0 or more." };
  }

  if (!Number.isFinite(Number(form.validityDays)) || Number(form.validityDays) < 0) {
    errors.validityDays = { message: "Validity must be 0 or more." };
  }

  if (form.url && !/^https?:\/\/.+/i.test(form.url)) {
    errors.url = { message: "Enter a valid http or https URL." };
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

  const handleImageChange = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField(field, reader.result);
      }
    };
    reader.readAsDataURL(file);
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
          label="Package name"
          name="title"
          icon={Package}
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={errors.title}
          placeholder="Officer cash batch"
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
          label="Discount Price"
          name="discountPrice"
          type="number"
          min="0"
          icon={BadgePercent}
          value={form.discountPrice}
          onChange={(event) =>
            updateField("discountPrice", event.target.value)
          }
          error={errors.discountPrice}
          placeholder="299"
        />
        <TextInput
          label="Publish date and time"
          name="publishedAt"
          type="datetime-local"
          icon={CalendarClock}
          value={form.publishedAt}
          onChange={(event) => updateField("publishedAt", event.target.value)}
        />
        <TextInput
          label="Url"
          name="url"
          icon={LinkIcon}
          value={form.url}
          onChange={(event) => updateField("url", event.target.value)}
          error={errors.url}
          placeholder="https://t.me/..."
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

      <div className="grid gap-4 lg:grid-cols-3">
        <FileUpload
          label="Package image"
          name="packageImage"
          accept=".jpg,.jpeg,.png,.webp"
          existingUrl={form.imageUrl}
          existingFileName={`${form.title || "Package"} image`}
          onChange={handleImageChange("imageUrl")}
          onRemoveExisting={() => updateField("imageUrl", "")}
          uploadHint="JPG, PNG, WEBP (Max. 5MB)"
        />
        <FileUpload
          label="Package Banner image"
          name="packageBannerImage"
          accept=".jpg,.jpeg,.png,.webp"
          existingUrl={form.bannerImageUrl}
          existingFileName={`${form.title || "Package"} banner`}
          onChange={handleImageChange("bannerImageUrl")}
          onRemoveExisting={() => updateField("bannerImageUrl", "")}
          uploadHint="JPG, PNG, WEBP (Max. 5MB)"
        />
        <FileUpload
          label="Package icon image"
          name="packageIconImage"
          accept=".jpg,.jpeg,.png,.webp"
          existingUrl={form.iconImageUrl}
          existingFileName={`${form.title || "Package"} icon`}
          onChange={handleImageChange("iconImageUrl")}
          onRemoveExisting={() => updateField("iconImageUrl", "")}
          uploadHint="JPG, PNG, WEBP (Max. 5MB)"
        />
      </div>

      <div className="space-y-4">
        <div className="field-group">
          <label className="field-label">
            Package details
          </label>
          <Tiptap
            ariaLabel="Package details editor"
            value={form.rulesHtml}
            onChange={(html) => updateField("rulesHtml", html)}
            minHeight={260}
            placeholder="Write package details, rules and equations..."
          />
          <span className="text-xs text-muted">
            Format details with lists, colors, alignment, links, images and equation tools.
          </span>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
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
