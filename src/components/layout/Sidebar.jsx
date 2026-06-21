"use client";

import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Layers,
  LayoutDashboard,
  MapPinned,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Pharmacy List",
    icon: ShieldAlert,
    href: "/pharmacies",
  },
  {
    label: "Medicine Inventory",
    icon: Layers,
    isDropdown: true,
    children: [
      { label: "Medicines", href: "/medicine/medicines" },
      { label: "Generics", href: "/medicine/generics" },
      { label: "Medicine Type", href: "/medicine/medicine-type" },
      { label: "Manufacturer", href: "/medicine/manufacturers" },
      //{ label: "Quantity Type", href: "/medicine/quantity-type" },
    ],
  },
  // {
  //   label: "Shop Supplier",
  //   icon: Toolbox,
  //   href: "/shop-supplier",
  // },
  {
    label: "Area",
    icon: MapPinned,
    href: "/areas",
  },
  { label: "Payment Methods", icon: CreditCard, href: "/payment-methods" },
  // {
  //   label: "User Management",
  //   icon: Users,
  //   isDropdown: true,
  //   children: [
  //     { label: "All Users", href: "/users" },
  //     //{ label: "Suspended", href: "/users/suspended" },
  //   ],
  // },
  {
    label: "User Management",
    icon: Users,
    href: "/user-management",
  },
  // {
  //   label: "Analytics",
  //   icon: BarChart3,
  //   href: "/analytics",
  // },
  // {
  //   label: "System Roles",
  //   icon: Layers,
  //   isDropdown: true,
  //   children: [
  //     { label: "Permissions", href: "/roles/permissions" },
  //     { label: "Access Logs", href: "/roles/logs" },
  //   ],
  // },
  // {
  //   label: "Settings",
  //   icon: Settings,
  //   href: "/settings",
  // },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (label, isOpen) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !isOpen }));
  };

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-white/10 bg-sidebar text-slate-300 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-black text-white">
          <ShieldAlert size={18} />
        </div>
        <span className="text-lg font-bold tracking-wide text-white">
          Wiz <span className="text-brand">Pharma</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.isDropdown) {
            const isChildActive = item.children?.some(
              (child) => pathname === child.href,
            );
            const isOpen = openDropdowns[item.label] ?? Boolean(isChildActive);

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleDropdown(item.label, isOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200
                    ${
                      isChildActive
                        ? "bg-white/10 text-brand"
                        : "hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${isChildActive ? "text-brand" : "text-slate-400 group-hover:text-white"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-9 space-y-1 mt-1 border-l border-slate-800 ml-6">
                    {item.children?.map((child) => {
                      const isSubActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-4 py-2 text-xs font-medium rounded-lg transition-colors
                            ${
                              isSubActive
                                ? "bg-white/10 font-semibold text-brand"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/20"
                            }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200
                ${
                  isActive
                    ? "bg-brand font-semibold text-white shadow-md shadow-black/10"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
