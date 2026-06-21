"use client";

import {
  ArrowRight,
  AtSign,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { TextInput } from "@/components/ui/forms/TextInput";
import {
  AUTH_SESSION_TOKEN,
  LOGIN_TOAST_KEY,
  SUPER_ADMIN_USER,
  createAuthCookieValue,
  isValidSuperAdminLogin,
} from "@/lib/auth";
import { setCredentials } from "@/store/authSlice";

const initialForm = {
  email: "",
  password: "",
};

function getSafeNextPath(nextPath) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  if (nextPath.startsWith("/login")) {
    return "/";
  }

  return nextPath;
}

function validateForm(form) {
  const errors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = { message: "Email is required." };
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = { message: "Enter a valid email address." };
  }

  if (!form.password) {
    errors.password = { message: "Password is required." };
  } else if (form.password.length < 6) {
    errors.password = { message: "Password must be at least 6 characters." };
  }

  return errors;
}

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      delete nextErrors.credentials;
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }

    if (!isValidSuperAdminLogin(form)) {
      setErrors({
        credentials: {
          message: "Email or password did not match a super admin account.",
        },
      });
      toast.error("Invalid login credentials.");
      return;
    }

    startTransition(() => {
      document.cookie = createAuthCookieValue();
      window.sessionStorage.setItem(LOGIN_TOAST_KEY, "1");
      dispatch(
        setCredentials({
          token: AUTH_SESSION_TOKEN,
          user: SUPER_ADMIN_USER,
        }),
      );
      router.replace(getSafeNextPath(searchParams.get("next")));
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app px-4 py-8 text-foreground sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl shadow-slate-200/70 sm:p-7">
        <div className="mb-7 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white">
            <ShieldCheck size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Admin login
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Email"
            name="email"
            type="email"
            icon={AtSign}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            placeholder="admin@example.com"
            autoComplete="email"
          />

          <TextInput
            label="Password"
            name="password"
            type="password"
            icon={LockKeyhole}
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            error={errors.password}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          {errors.credentials && (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
              role="alert"
            >
              {errors.credentials.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="button button-primary min-h-11 w-full"
          >
            <span>{isPending ? "Signing in..." : "Sign in"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
