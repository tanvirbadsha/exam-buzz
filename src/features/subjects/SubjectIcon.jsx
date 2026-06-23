"use client";

import Image from "next/image";

export function isUploadedSubjectIcon(icon) {
  return typeof icon === "string" && icon.startsWith("data:image/");
}

export function SubjectIcon({ icon, name, className = "h-9 w-9 text-xs" }) {
  const fallbackText = name?.slice(0, 2).toUpperCase() || "SB";

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft font-black text-brand-strong ${className}`}
    >
      {isUploadedSubjectIcon(icon) ? (
        <Image
          src={icon}
          alt=""
          fill
          sizes="56px"
          unoptimized
          className="object-cover"
          aria-hidden="true"
        />
      ) : (
        icon || fallbackText
      )}
    </span>
  );
}
