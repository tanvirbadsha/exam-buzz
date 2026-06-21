"use client";

export function ToolbarActionButton({
  icon: Icon,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`button button-secondary whitespace-nowrap ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2.2} />}
      <span>{children}</span>
    </button>
  );
}
