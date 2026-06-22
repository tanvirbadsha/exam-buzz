import Image from "next/image";
import { getAdminInitials } from "@/lib/adminData";

export function AdminAvatar({ admin, size = "md" }) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm";

  if (admin.imageUrl) {
    return (
      <Image
        src={admin.imageUrl}
        alt={`${admin.name} profile`}
        width={size === "lg" ? 64 : 44}
        height={size === "lg" ? 64 : 44}
        unoptimized
        className={`${sizeClass} rounded-lg border border-border object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-lg border border-brand-soft bg-brand-soft font-bold text-brand-strong`}
      aria-label={`${admin.name} profile initials`}
    >
      {getAdminInitials(admin.name)}
    </span>
  );
}
