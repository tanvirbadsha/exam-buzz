"use client";

export default function RejectButton({
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
      className={`button button-danger button-compact ${className}`}
    >
      {children || "Reject"}
    </button>
  );
}
