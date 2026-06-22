"use client";

import {
  AtSign,
  BadgeCheck,
  Hash,
  MapPin,
  Package,
  Phone,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { STUDENT_PACKAGE_OPTIONS } from "@/lib/studentData";

const packageOptions = STUDENT_PACKAGE_OPTIONS.filter(
  (option) => option.value !== "all",
);

const emptyStudent = {
  name: "",
  userId: "",
  phone: "",
  registrationId: "",
  purchasedPackage: "BCS Complete",
  purchasedPackageCount: 1,
  purchaseAmount: 0,
  preliminaryExam: 0,
  writtenExam: 0,
  isActive: true,
  email: "",
  address: "",
};

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Name is required." };
  }

  if (!form.phone.trim()) {
    errors.phone = { message: "Phone is required." };
  }

  if (!form.userId.trim()) {
    errors.userId = { message: "User ID is required." };
  }

  if (!form.registrationId.trim()) {
    errors.registrationId = { message: "Registration ID is required." };
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = { message: "Enter a valid email address." };
  }

  [
    ["purchasedPackageCount", "Purchased package"],
    ["purchaseAmount", "Purchase amount"],
    ["preliminaryExam", "Preliminary exam"],
    ["writtenExam", "Written exam"],
  ].forEach(([field, label]) => {
    const value = Number(form[field]);
    if (!Number.isFinite(value) || value < 0) {
      errors[field] = { message: `${label} must be 0 or more.` };
    }
  });

  return errors;
}

export function StudentForm({
  student,
  onSubmit,
  submitLabel = "Save student",
  secondaryAction,
}) {
  const initialForm = useMemo(
    () => ({ ...emptyStudent, ...student }),
    [student],
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
          label="Name"
          name="name"
          icon={UserRound}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={errors.name}
          placeholder="Student name"
        />
        <TextInput
          label="User ID"
          name="userId"
          icon={Hash}
          value={form.userId}
          onChange={(event) => updateField("userId", event.target.value)}
          error={errors.userId}
          placeholder="USR-1006"
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
          label="Registration ID"
          name="registrationId"
          icon={BadgeCheck}
          value={form.registrationId}
          onChange={(event) =>
            updateField("registrationId", event.target.value)
          }
          error={errors.registrationId}
          placeholder="REG-2026-006"
        />
        <CustomDropdown
          label="Purchased Package"
          icon={Package}
          options={packageOptions}
          value={form.purchasedPackage}
          onChange={(option) => updateField("purchasedPackage", option.value)}
          placeholder="Select package"
        />
        <TextInput
          label="Purchase Amount"
          name="purchaseAmount"
          type="number"
          min="0"
          value={form.purchaseAmount}
          onChange={(event) =>
            updateField("purchaseAmount", event.target.value)
          }
          error={errors.purchaseAmount}
          placeholder="0"
        />
        <TextInput
          label="Purchased Package Count"
          name="purchasedPackageCount"
          type="number"
          min="0"
          value={form.purchasedPackageCount}
          onChange={(event) =>
            updateField("purchasedPackageCount", event.target.value)
          }
          error={errors.purchasedPackageCount}
          placeholder="0"
        />
        <TextInput
          label="Preliminary Exam"
          name="preliminaryExam"
          type="number"
          min="0"
          value={form.preliminaryExam}
          onChange={(event) =>
            updateField("preliminaryExam", event.target.value)
          }
          error={errors.preliminaryExam}
          placeholder="0"
        />
        <TextInput
          label="Written Exam"
          name="writtenExam"
          type="number"
          min="0"
          value={form.writtenExam}
          onChange={(event) => updateField("writtenExam", event.target.value)}
          error={errors.writtenExam}
          placeholder="0"
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          icon={AtSign}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={errors.email}
          placeholder="student@example.com"
        />
        <div className="md:col-span-2">
          <TextInput
            label="Address"
            name="address"
            icon={MapPin}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="City, country"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => updateField("isActive", event.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        <span>
          <span className="block text-sm font-semibold text-foreground">
            Active student
          </span>
          <span className="block text-xs text-muted">
            Active students can access purchased packages.
          </span>
        </span>
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button type="submit" className="button button-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
