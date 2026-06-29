"use client";

import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { createContext, useContext } from "react";

const QuickCreateMenuContext = createContext({
  closeMenu: () => {},
});

export function QuickCreateMenu({
  ariaLabel = "Open quick create options",
  children,
  label = "Quick Create",
  menuHeight = 176,
}) {
  return (
    <FloatingActionMenu
      ariaLabel={ariaLabel}
      menuHeight={menuHeight}
      triggerClassName="button button-primary min-h-11 flex items-center gap-2 px-4 rounded-md"
      triggerContent={
        <>
          <Plus size={16} />
          <span>{label}</span>
          <ChevronDown size={14} className="opacity-70" />
        </>
      }
    >
      {({ closeMenu }) => (
        <QuickCreateMenuContext.Provider value={{ closeMenu }}>
          <div className="flex flex-col">{children}</div>
        </QuickCreateMenuContext.Provider>
      )}
    </FloatingActionMenu>
  );
}

export function QuickCreateMenuItem({ children, href }) {
  const { closeMenu } = useContext(QuickCreateMenuContext);

  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
      onClick={closeMenu}
    >
      {children}
    </Link>
  );
}
