"use client";

import {
  AtSign,
  CheckCircle2,
  LockKeyhole,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  STUDENT_ACCOUNT_STATUS_OPTIONS,
  STUDENT_GENDER_OPTIONS,
} from "@/lib/studentData";

const emptyStudent = {
  name: "",
  gender: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  status: "",
  image: null,
};

function getInitialStudent(student) {
  const status =
    typeof student?.status === "boolean"
      ? student.status
        ? "active"
        : "inactive"
      : typeof student?.isActive === "boolean"
        ? student.isActive
          ? "active"
          : "inactive"
        : student?.status || emptyStudent.status;

  return {
    ...emptyStudent,
    ...student,
    gender: student?.gender || emptyStudent.gender,
    status,
    password: student?.password || "",
    confirmPassword: "",
    image: null,
  };
}

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
  } else if (isCreateMode && form.password.trim().length < 6) {
    errors.password = { message: "Password must be at least 6 characters." };
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

export function StudentForm({
  student,
  onSubmit,
  submitLabel = "Save student",
  secondaryAction,
  isSubmitting = false,
}) {
  const initialForm = useMemo(() => getInitialStudent(student), [student]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const isCreateMode = !student;
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = buildErrors(form, isCreateMode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      image: form.image,
      ...(isCreateMode
        ? {
            password: form.password.trim(),
            ...(form.status
              ? { status: form.status === "active" ? "true" : "false" }
              : {}),
            ...(form.gender ? { gender: form.gender } : {}),
          }
        : {}),
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
          placeholder="Student name"
        />
        {isCreateMode && (
          <CustomDropdown
            label="Gender"
            icon={UsersRound}
            options={STUDENT_GENDER_OPTIONS}
            value={form.gender}
            onChange={(option) => updateField("gender", option.value)}
            error={errors.gender}
            placeholder="Select gender"
          />
        )}
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
          placeholder="student@example.com"
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
              placeholder="Minimum 6 characters"
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
            <CustomDropdown
              label="Status"
              icon={CheckCircle2}
              options={STUDENT_ACCOUNT_STATUS_OPTIONS}
              value={form.status}
              onChange={(option) => updateField("status", option.value)}
              error={errors.status}
              placeholder="Select status"
            />
          </>
        )}
        <div className="md:col-span-2">
          <FileUpload
            label="Image"
            name="image"
            accept=".jpg,.jpeg,.png,.webp"
            existingUrl={student?.imageUrl || student?.image}
            existingFileName={student?.image ? "Current image" : ""}
            uploadHint="JPG, PNG, WebP (Max. 5MB)"
            onChange={(event) =>
              updateField("image", event.target.files?.[0] || null)
            }
            onRemoveExisting={() => updateField("image", null)}
          />
        </div>
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
