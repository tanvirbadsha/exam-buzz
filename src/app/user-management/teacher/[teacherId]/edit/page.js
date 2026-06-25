"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";
import { GlobalSpinner } from "@/components/ui/GlobalSpinner";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  useGetTeacherByIdQuery,
  useResetTeacherPassByAdminMutation,
} from "@/features/users/teacher/api/teacherApi";
import { TeacherNotFound } from "@/features/users/teacher/TeacherNotFound";
import {
  getApiErrorMessage,
  normalizeTeacher,
} from "@/features/users/teacher/teacherUtils";
import { ArrowLeft, ClipboardCopy, LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function EditTeacherPage() {
  const { teacherId } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [resetPasswordToCopy, setResetPasswordToCopy] = useState("");
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useGetTeacherByIdQuery(teacherId);
  const [resetTeacherPassByAdmin, { isLoading: isResettingPassword }] =
    useResetTeacherPassByAdminMutation();
  const teacher = normalizeTeacher(data?.teacher || data);

  if (isLoading) return <GlobalSpinner label="Loading teacher..." />;

  if (error?.status === 404) return <TeacherNotFound />;
  if (error) {
    return (
      <ErrorCard
        title="Unable to load teacher"
        message={getApiErrorMessage(
          error,
          "The teacher profile could not load.",
        )}
        onRetry={refetch}
      />
    );
  }
  if (!teacher) return <TeacherNotFound />;

  const handlePasswordReset = async () => {
    const password = newPassword.trim();

    if (!password) {
      toast.error("Enter a new password.");
      return;
    }

    const confirmed = window.confirm(
      `Reset ${teacher.name}'s password to "${password}"?`,
    );
    if (!confirmed) return;

    try {
      await resetTeacherPassByAdmin({
        id: teacher.id,
        password,
      }).unwrap();
      toast.success("Teacher password reset.");
      setResetPasswordToCopy(password);
      setNewPassword("");
    } catch (resetError) {
      toast.error(
        getApiErrorMessage(resetError, "Failed to reset password."),
      );
    }
  };

  const handleCopyPassword = async () => {
    const password = resetPasswordToCopy.trim();

    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied.");
    } catch {
      toast.error("Password could not be copied.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/user-management/teacher" className="back-link">
          <ArrowLeft size={14} />
          Back to teachers
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Edit teacher
        </h1>
        <p className="mt-2 text-sm text-muted">
          Reset the account password for {teacher.name}.
        </p>
      </div>

      <section className="surface-card p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Reset password
          </h2>
          <p className="mt-1 text-sm text-muted">
            Teacher profile details are read-only for admins.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <TextInput
            label="New password"
            name="newPassword"
            type="password"
            icon={LockKeyhole}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter new password"
          />
          <button
            type="button"
            className="button button-primary"
            onClick={handlePasswordReset}
            disabled={isResettingPassword || !newPassword.trim()}
          >
            {isResettingPassword ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </section>

      {resetPasswordToCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            aria-label="Close password reset modal"
            onClick={() => setResetPasswordToCopy("")}
          />
          <div className="relative w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="reset-password-title"
                  className="text-lg font-bold text-foreground"
                >
                  Password reset
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Copy this password now. Once this modal is closed, the
                  password will not be shown again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordToCopy("")}
                className="icon-button h-9 w-9"
                aria-label="Close password reset modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-foreground">
              {resetPasswordToCopy}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setResetPasswordToCopy("")}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleCopyPassword}
              >
                <ClipboardCopy size={16} />
                Copy password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
