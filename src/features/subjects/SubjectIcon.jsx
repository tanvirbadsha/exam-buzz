"use client";

export function isUploadedSubjectIcon(icon) {
  return (
    typeof icon === "string" &&
    (icon.startsWith("data:image/") ||
      icon.startsWith("http://") ||
      icon.startsWith("https://") ||
      icon.startsWith("/"))
  );
}

export function SubjectIcon({ icon, name, className = "h-9 w-9 text-xs" }) {
  const fallbackText = name?.slice(0, 2).toUpperCase() || "SB";

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft font-black text-brand-strong ${className}`}
    >
      {isUploadedSubjectIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        icon || fallbackText
      )}
    </span>
  );
}
