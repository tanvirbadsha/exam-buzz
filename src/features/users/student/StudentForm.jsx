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
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  STUDENT_ACCOUNT_STATUS_OPTIONS,
  STUDENT_GENDER_OPTIONS,
} from "@/lib/studentData";

const emptyStudent = {
  name: "",
  gender: "male",
  phone: "",
  email: "",
  password: "",
  isActive: "active",
};

function getInitialStudent(student) {
  return {
    ...emptyStudent,
    ...student,
    gender: student?.gender || emptyStudent.gender,
    isActive:
      typeof student?.isActive === "boolean"
        ? student.isActive
          ? "active"
          : "inactive"
        : student?.isActive || emptyStudent.isActive,
    password: student?.password || "",
  };
}

function buildErrors(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Name is required." };
  }

  if (!form.gender) {
    errors.gender = { message: "Gender is required." };
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

  if (!form.isActive) {
    errors.isActive = { message: "Status is required." };
  }

  return errors;
}

export function StudentForm({
  student,
  onSubmit,
  submitLabel = "Save student",
  secondaryAction,
}) {
  const initialForm = useMemo(() => getInitialStudent(student), [student]);
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
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
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
        <CustomDropdown
          label="Gender"
          icon={UsersRound}
          options={STUDENT_GENDER_OPTIONS}
          value={form.gender}
          onChange={(option) => updateField("gender", option.value)}
          error={errors.gender}
          placeholder="Select gender"
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
          placeholder="student@example.com"
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
        <CustomDropdown
          label="Status"
          icon={CheckCircle2}
          options={STUDENT_ACCOUNT_STATUS_OPTIONS}
          value={form.isActive}
          onChange={(option) => updateField("isActive", option.value)}
          error={errors.isActive}
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
