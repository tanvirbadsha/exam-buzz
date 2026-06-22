"use client";

import {
  BadgeCheck,
  BadgeDollarSign,
  Hash,
  PackageCheck,
  RotateCcw,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  PACKAGE_ASSIGNMENT_STORAGE_KEY,
  createPackageAssignmentId,
  formatAssignmentAmount,
} from "@/lib/packageAssignmentData";

const defaultValues = {
  registrationId: "",
  transactionId: "",
  amount: "",
  packageId: "",
};

function readAssignments() {
  if (typeof window === "undefined") return [];

  try {
    const storedAssignments = window.localStorage.getItem(
      PACKAGE_ASSIGNMENT_STORAGE_KEY,
    );
    const parsedAssignments = JSON.parse(storedAssignments || "[]");
    return Array.isArray(parsedAssignments) ? parsedAssignments : [];
  } catch {
    return [];
  }
}

function writeAssignments(assignments) {
  window.localStorage.setItem(
    PACKAGE_ASSIGNMENT_STORAGE_KEY,
    JSON.stringify(assignments),
  );
}

export function AssignPackageForm({ packages }) {
  const [recentAssignments, setRecentAssignments] = useState([]);
  const packageOptions = useMemo(
    () =>
      packages.map((packageInfo) => ({
        label: packageInfo.title,
        value: packageInfo.id,
        meta: `${Number(packageInfo.price || 0).toLocaleString("en-BD")} ${
          packageInfo.currency || "BDT"
        }`,
        searchText: `${packageInfo.title} ${packageInfo.packageType} ${packageInfo.price}`,
      })),
    [packages],
  );
  const packageMap = useMemo(
    () => new Map(packages.map((packageInfo) => [packageInfo.id, packageInfo])),
    [packages],
  );
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = (formValues) => {
    const selectedPackage = packageMap.get(formValues.packageId);
    const nextAssignment = {
      id: createPackageAssignmentId(),
      registrationId: formValues.registrationId.trim(),
      transactionId: formValues.transactionId.trim(),
      amount: Number(formValues.amount),
      packageId: formValues.packageId,
      packageTitle: selectedPackage?.title || "Unknown package",
      assignedAt: new Date().toISOString(),
    };
    const nextAssignments = [nextAssignment, ...readAssignments()];

    writeAssignments(nextAssignments);
    setRecentAssignments(nextAssignments.slice(0, 5));
    toast.success(`${nextAssignment.packageTitle} assigned.`);
    reset(defaultValues);
  };

  const handleReset = () => {
    reset(defaultValues);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section>
        <p className="text-sm font-semibold text-brand-strong">
          Package Management
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
          Assign package
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Assign an available package to a student account using registration
          and payment details.
        </p>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">
            Assignment details
          </h2>
          <p className="mt-1 text-sm text-muted">
            Required fields are registration ID, amount and package.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Registration ID"
              name="registrationId"
              icon={BadgeCheck}
              placeholder="REG-2026-001"
              error={errors.registrationId}
              {...register("registrationId", {
                required: "Registration ID is required.",
                validate: (value) =>
                  Boolean(value.trim()) || "Registration ID is required.",
              })}
            />
            <TextInput
              label="Transaction ID"
              name="transactionId"
              icon={Hash}
              placeholder="TXN-123456"
              error={errors.transactionId}
              {...register("transactionId")}
            />
            <TextInput
              label="Amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              icon={BadgeDollarSign}
              placeholder="397"
              error={errors.amount}
              {...register("amount", {
                required: "Amount is required.",
                valueAsNumber: true,
                validate: (value) =>
                  Number(value) > 0 || "Amount must be greater than 0.",
              })}
            />
            <Controller
              control={control}
              name="packageId"
              rules={{ required: "Select a package." }}
              render={({ field, fieldState }) => (
                <CustomDropdown
                  label="Select package"
                  icon={PackageCheck}
                  options={packageOptions}
                  value={field.value}
                  onChange={(option) => field.onChange(option.value)}
                  error={fieldState.error}
                  placeholder="Search and select package"
                  searchPlaceholder="Search packages..."
                />
              )}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              <Save size={16} />
              Assign package
            </button>
          </div>
        </form>
      </section>

      {recentAssignments.length > 0 && (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold text-foreground">
              Recent assignments
            </h2>
          </div>
          <div className="divide-y divide-border">
            {recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <p className="font-bold text-foreground">
                    {assignment.registrationId}
                  </p>
                  <p className="mt-1 text-muted">{assignment.packageTitle}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {assignment.transactionId || "No transaction ID"}
                  </p>
                  <p className="mt-1 text-muted">
                    {new Date(assignment.assignedAt).toLocaleString()}
                  </p>
                </div>
                <p className="font-black text-brand-strong md:text-right">
                  {formatAssignmentAmount(assignment.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

