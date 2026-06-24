"use client";

import {
  Eye,
  KeyRound,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";

export function AdminActionMenu({
  admin,
  onDelete,
  canDelete = true,
  isDeleting = false,
}) {
  const isSuperAdmin = admin.isSuperAdmin || admin.role === "super_admin";
  const isDeleteDisabled = !canDelete || isSuperAdmin || isDeleting;

  const actionLinks = [
    {
      href: `/user-management/admin/${admin.id}/view`,
      label: "View",
      icon: Eye,
    },
    {
      href: `/user-management/admin/${admin.id}/edit`,
      label: "Edit",
      icon: Pencil,
    },
    {
      href: `/user-management/admin/${admin.id}/access-control`,
      label: "Access control",
      icon: KeyRound,
    },
  ];

  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${admin.name}`}
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
            disabled={isDeleteDisabled}
            onClick={() => {
              closeMenu();
              onDelete(admin);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50 disabled:text-muted disabled:hover:bg-transparent"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </FloatingActionMenu>
  );
}
