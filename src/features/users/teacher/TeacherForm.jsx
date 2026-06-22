"use client";

import { AtSign, LockKeyhole, MapPin, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { TextInput } from "@/components/ui/forms/TextInput";

const emptyTeacher = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  permissions: ["BCS"],
};

function buildErrors(form) {
  const errors = {};

  if (!form.fullName.trim()) {
    errors.fullName = { message: "Full name is required." };
  }

  if (!form.phone.trim()) {
    errors.phone = { message: "Phone is required." };
  }

  if (!form.email.trim()) {
    errors.email = { message: "Email is required." };
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = { message: "Enter a valid email address." };
  }

  if (!form.password) {
    errors.password = { message: "Password is required." };
  } else if (form.password.length < 6) {
    errors.password = { message: "Password must be at least 6 characters." };
  }

  if (!form.address.trim()) {
    errors.address = { message: "Address is required." };
  }

  return errors;
}

export function TeacherForm({
  teacher,
  onSubmit,
  submitLabel = "Save teacher",
  secondaryAction,
}) {
  const initialForm = useMemo(
    () => ({ ...emptyTeacher, ...teacher }),
    [teacher],
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
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Full Name"
          name="fullName"
          icon={UserRound}
          value={form.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          error={errors.fullName}
          placeholder="Teacher full name"
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
          placeholder="teacher@example.com"
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          icon={LockKeyhole}
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={errors.password}
          placeholder="Minimum 6 characters"
        />
        <div className="md:col-span-2">
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
