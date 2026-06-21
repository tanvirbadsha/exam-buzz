"use client";

export function StatusToggle({
  checked,
  disabled = false,
  label,
  onChange,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      } ${disabled ? "cursor-wait opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
