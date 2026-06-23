"use client";

import {
  BadgeCheck,
  BadgeDollarSign,
  Hash,
  PackageCheck,
  Phone,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { usePackageAssignmentManagement } from "@/hooks/usePackageAssignmentManagement";
import { usePackageInfoManagement } from "@/hooks/usePackageInfoManagement";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import {
  PAYMENT_METHOD_OPTIONS,
  formatAssignmentAmount,
  getPaymentMethodLabel,
} from "@/lib/packageAssignmentData";

const defaultValues = {
  phoneNumber: "",
  registrationId: "",
  studentId: "",
  studentName: "",
  packageId: "",
  amount: "",
  transactionId: "",
  paymentMethod: "cash",
};

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.startsWith("1") && digits.length === 10) return `0${digits}`;
  return digits;
}

function findStudentByPhone(students, phoneNumber) {
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) return null;

  return (
    students.find(
      (student) => normalizePhone(student.phone) === normalizedPhone,
    ) || null
  );
}

function findStudentByRegistration(students, registrationId) {
  const normalizedRegistrationId = String(registrationId || "")
    .trim()
    .toLowerCase();
  if (!normalizedRegistrationId) return null;

  return (
    students.find(
      (student) =>
        student.registrationId.trim().toLowerCase() ===
        normalizedRegistrationId,
    ) || null
  );
}

export function AssignPackageForm({ initialPackages }) {
  const { assignments, createAssignment } = usePackageAssignmentManagement();
  const { packages } = usePackageInfoManagement(initialPackages);
  const { students } = useStudentManagement();
  const [lookupSource, setLookupSource] = useState("phone");
  const autoFilledStudentRef = useRef(null);

  const activePackages = useMemo(
    () => packages.filter((packageInfo) => packageInfo.status === "active"),
    [packages],
  );
  const packageOptions = useMemo(
    () =>
      activePackages.map((packageInfo) => ({
        label: packageInfo.title,
        value: packageInfo.id,
        meta: `${Number(packageInfo.price || 0).toLocaleString("en-BD")} ${
          packageInfo.currency || "BDT"
        }`,
        searchText: `${packageInfo.title} ${packageInfo.packageType} ${packageInfo.price}`,
      })),
    [activePackages],
  );
  const packageMap = useMemo(
    () =>
      new Map(activePackages.map((packageInfo) => [packageInfo.id, packageInfo])),
    [activePackages],
  );

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  const phoneNumber = useWatch({ control, name: "phoneNumber" });
  const registrationId = useWatch({ control, name: "registrationId" });
  const studentName = useWatch({ control, name: "studentName" });

  useEffect(() => {
    const matchedStudent =
      lookupSource === "registration"
        ? findStudentByRegistration(students, registrationId)
        : findStudentByPhone(students, phoneNumber);
    const previousAutoFilledStudent = autoFilledStudentRef.current;

    if (matchedStudent) {
      autoFilledStudentRef.current = matchedStudent;
      setValue("studentId", matchedStudent.id, { shouldValidate: true });
      setValue("studentName", matchedStudent.name, { shouldValidate: true });
      setValue("phoneNumber", matchedStudent.phone, { shouldValidate: true });
      setValue("registrationId", matchedStudent.registrationId, {
        shouldValidate: true,
      });
      return;
    }

    setValue("studentId", "");
    setValue("studentName", "");

    if (
      lookupSource === "phone" &&
      previousAutoFilledStudent?.registrationId === registrationId
    ) {
      setValue("registrationId", "");
    }

    if (
      lookupSource === "registration" &&
      previousAutoFilledStudent?.phone === phoneNumber
    ) {
      setValue("phoneNumber", "");
    }
  }, [lookupSource, phoneNumber, registrationId, setValue, students]);

  const onSubmit = (formValues) => {
    const matchedStudent =
      findStudentByRegistration(students, formValues.registrationId) ||
      findStudentByPhone(students, formValues.phoneNumber);

    if (!matchedStudent) {
      setError("registrationId", {
        message: "Student was not found by phone number or registration ID.",
      });
      setError("phoneNumber", {
        message: "Student was not found by phone number or registration ID.",
      });
      return;
    }

    const selectedPackage = packageMap.get(formValues.packageId);
    const nextAssignment = createAssignment({
      studentId: matchedStudent.id,
      studentName: matchedStudent.name,
      phoneNumber: matchedStudent.phone,
      registrationId: matchedStudent.registrationId,
      transactionId: formValues.transactionId.trim(),
      paymentMethod: formValues.paymentMethod,
      amount: Number(formValues.amount),
      packageId: formValues.packageId,
      packageTitle: selectedPackage?.title || "Unknown package",
      packageCurrency: selectedPackage?.currency || "BDT",
    });

    toast.success(`${nextAssignment.packageTitle} assigned.`);
    reset(defaultValues);
  };

  const handleReset = () => {
    autoFilledStudentRef.current = null;
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
          Find a student by phone number or registration ID, then assign a
          package with payment details.
        </p>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">
            Assignment details
          </h2>
          <p className="mt-1 text-sm text-muted">
            Phone number and registration ID can fill each other when a student
            record is found.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="phoneNumber"
              rules={{
                required: "Phone number is required.",
                validate: (value) =>
                  Boolean(normalizePhone(value)) || "Phone number is required.",
              }}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Phone number"
                  name={field.name}
                  icon={Phone}
                  value={field.value}
                  placeholder="+880 1XXX-XXXXXX"
                  error={fieldState.error}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    setLookupSource("phone");
                    field.onChange(event);
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="registrationId"
              rules={{
                required: "Registration ID is required.",
                validate: (value) =>
                  Boolean(value.trim()) || "Registration ID is required.",
              }}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Registration ID"
                  name={field.name}
                  icon={BadgeCheck}
                  value={field.value}
                  placeholder="REG-2026-001"
                  error={fieldState.error}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    setLookupSource("registration");
                    field.onChange(event);
                  }}
                />
              )}
            />

            <div className="md:col-span-2">
              <input
                type="hidden"
                {...register("studentId", {
                  required: "Find a student before assigning a package.",
                })}
              />
              <TextInput
                label="Student name"
                name="studentName"
                icon={UserRound}
                value={studentName || ""}
                placeholder="Student name appears after lookup"
                disabled
                readOnly
                error={errors.studentId}
              />
            </div>

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
                  onChange={(option) => {
                    field.onChange(option.value);
                    const selectedPackage = packageMap.get(option.value);
                    setValue("amount", selectedPackage?.price || "", {
                      shouldValidate: true,
                    });
                  }}
                  error={fieldState.error}
                  placeholder="Search and select package"
                  searchPlaceholder="Search packages..."
                />
              )}
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

            <TextInput
              label="Transaction ID"
              name="transactionId"
              icon={Hash}
              placeholder="TXN-123456"
              error={errors.transactionId}
              {...register("transactionId")}
            />
            <fieldset className="field-group">
              <legend className="field-label">Payment method</legend>
              <div className="grid min-h-11 grid-cols-2 gap-2 sm:grid-cols-4">
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-strong"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="h-4 w-4 accent-brand"
                      {...register("paymentMethod", {
                        required: "Select a payment method.",
                      })}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.paymentMethod && (
                <span className="field-error" role="alert">
                  {errors.paymentMethod.message}
                </span>
              )}
            </fieldset>
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

      {assignments.length > 0 && (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold text-foreground">
              Recent assignments
            </h2>
          </div>
          <div className="divide-y divide-border">
            {assignments.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1.1fr_1fr_auto]"
              >
                <div>
                  <p className="font-bold text-foreground">
                    {assignment.studentName || assignment.registrationId}
                  </p>
                  <p className="mt-1 text-muted">
                    {assignment.phoneNumber || "No phone"} ·{" "}
                    {assignment.registrationId}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {assignment.packageTitle}
                  </p>
                  <p className="mt-1 text-muted">
                    {getPaymentMethodLabel(assignment.paymentMethod)} ·{" "}
                    {assignment.transactionId || "No transaction ID"}
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
