"use client";

import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";

export function TeacherActionMenu({ teacher, onDelete }) {
  const actionLinks = [
    {
      href: `/user-management/teacher/${teacher.id}/view`,
      label: "View",
      icon: Eye,
    },
    {
      href: `/user-management/teacher/${teacher.id}/edit`,
      label: "Edit",
      icon: Pencil,
    },
  ];

  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${teacher.fullName}`}
      menuHeight={136}
      triggerIcon={<MoreVertical size={18} />}
    >
      {({ closeMenu }) => (
        <>
          {actionLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                onClick={closeMenu}
              >
                <Icon size={15} className="text-muted" />
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(teacher);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </FloatingActionMenu>
  );
}
