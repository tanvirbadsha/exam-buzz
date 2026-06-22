"use client";

import { AtSign, MapPin, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import { getRoleLabel } from "@/lib/adminData";

const emptyAdmin = {
  name: "",
  phone: "",
  email: "",
  address: "",
  imageUrl: "",
  role: "sub_admin",
  accessKeys: ["dashboard"],
};

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Name is required." };
  }

  if (!form.phone.trim()) {
    errors.phone = { message: "Phone is required." };
  }

  if (!form.email.trim()) {
    errors.email = { message: "Email is required." };
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = { message: "Enter a valid email address." };
  }

  if (!form.address.trim()) {
    errors.address = { message: "Address is required." };
  }

  return errors;
}

export function AdminForm({
  admin,
  onSubmit,
  submitLabel = "Save admin",
  secondaryAction,
}) {
  const initialForm = useMemo(() => ({ ...emptyAdmin, ...admin }), [admin]);
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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("imageUrl", reader.result);
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
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Name"
          name="name"
          icon={UserRound}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Admin name"
        />
        <TextInput
          label="Phone"
          name="phone"
          icon={Phone}
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={errors.phone}
          placeholder="+880 1XXX-XXXXXX"
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          icon={AtSign}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={errors.email}
          placeholder="admin@example.com"
        />
        <TextInput
          label="Address"
          name="address"
          icon={MapPin}
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          error={errors.address}
          placeholder="City, country"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <FileUpload
          label="Image"
          name="image"
          accept=".jpg,.jpeg,.png,.webp"
          existingUrl={form.imageUrl}
          existingFileName={`${form.name || "Admin"} image`}
          onChange={handleImageChange}
          onRemoveExisting={() => updateField("imageUrl", "")}
          uploadHint="JPG, PNG, WEBP (Max. 5MB)"
        />

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground">Account type</p>
          <p className="mt-2 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
            {getRoleLabel(form.role)}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            New accounts are sub admins. Menu permissions are managed from
            access control.
          </p>
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
