"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

export const TextInput = forwardRef(
  ({ label, icon: Icon, type = "text", error, placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const inputId = props.id || props.name;
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className="field-group">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}

        <div
          className={`field-shell px-3 ${error ? "field-shell-error" : ""}`}
        >
          {Icon && (
            <Icon
              size={16}
              className={`${error ? "text-rose-400" : "text-muted"} mr-2.5 shrink-0`}
            />
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className="field-input flex-1"
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
              className="ml-2 text-muted transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {error && (
          <span id={errorId} className="field-error" role="alert">
            {error.message}
          </span>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
