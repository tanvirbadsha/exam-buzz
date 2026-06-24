"use client";

import { AtSign, LockKeyhole, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { TextInput } from "@/components/ui/forms/TextInput";
import { getRoleLabel } from "@/lib/adminData";

const emptyAdmin = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "sub_admin",
  accessKeys: ["dashboard"],
};

function buildErrors(form, isCreateMode) {
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

  if (isCreateMode && !form.password.trim()) {
    errors.password = { message: "Password is required." };
  }

  if (isCreateMode && !form.confirmPassword.trim()) {
    errors.confirmPassword = { message: "Confirm password is required." };
  } else if (
    isCreateMode &&
    form.password.trim() !== form.confirmPassword.trim()
  ) {
    errors.confirmPassword = { message: "Passwords do not match." };
  }

  return errors;
}

export function AdminForm({
  admin,
  onSubmit,
  submitLabel = "Save admin",
  secondaryAction,
  isSubmitting = false,
}) {
  const initialForm = useMemo(() => ({ ...emptyAdmin, ...admin }), [admin]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const isCreateMode = !admin;
  const isCreatePasswordInvalid =
    isCreateMode &&
    (!form.password.trim() ||
      !form.confirmPassword.trim() ||
      form.password.trim() !== form.confirmPassword.trim());

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form, isCreateMode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      ...(isCreateMode ? { password: form.password.trim() } : {}),
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
        {isCreateMode && (
          <>
            <TextInput
              label="Password"
              name="password"
              type="password"
              icon={LockKeyhole}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              error={errors.password}
              placeholder="Admin@12345"
            />
            <TextInput
              label="Confirm password"
              name="confirmPassword"
              type="password"
              icon={LockKeyhole}
              value={form.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              error={
                errors.confirmPassword ||
                (form.confirmPassword &&
                form.password.trim() !== form.confirmPassword.trim()
                  ? { message: "Passwords do not match." }
                  : undefined)
              }
              placeholder="Re-type password"
            />
          </>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface-muted p-4">
        <p className="text-sm font-semibold text-foreground">Account type</p>
        <p className="mt-2 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
          {getRoleLabel(form.role)}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          New accounts are sub admins by default. Menu permissions are managed
          from access control.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting || isCreatePasswordInvalid}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
