"use client";

export default function ApproveButton({
  onClick,
  className = "",
  children,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`button button-primary button-compact ${className}`}
    >
      {children || "Approve"}
    </button>
  );
}
