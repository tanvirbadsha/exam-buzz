"use client";

import { Check, LockKeyhole, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ADMIN_MENU_OPTIONS, ALL_ADMIN_ACCESS_KEYS } from "@/lib/adminData";

export function AdminAccessControlForm({ admin, onSave, secondaryAction }) {
  const [selectedKeys, setSelectedKeys] = useState(admin.accessKeys);
  const isSuperAdmin = admin.role === "super_admin";

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const toggleKey = (key) => {
    if (isSuperAdmin) return;

    setSelectedKeys((currentKeys) => {
      if (currentKeys.includes(key)) {
        const nextKeys = currentKeys.filter((currentKey) => currentKey !== key);
        return nextKeys.length > 0 ? nextKeys : ["dashboard"];
      }

      return [...currentKeys, key];
    });
  };

  const toggleGroup = (groupItems) => {
    if (isSuperAdmin) return;

    const groupKeys = groupItems.map((item) => item.key);
    const isGroupSelected = groupKeys.every((key) => selectedKeySet.has(key));

    setSelectedKeys((currentKeys) => {
      if (isGroupSelected) {
        const nextKeys = currentKeys.filter((key) => !groupKeys.includes(key));
        return nextKeys.length > 0 ? nextKeys : ["dashboard"];
      }

      return [...new Set([...currentKeys, ...groupKeys])];
    });
  };

  const selectAllMenus = () => {
    if (isSuperAdmin) return;
    setSelectedKeys(ALL_ADMIN_ACCESS_KEYS);
  };

  const clearToDashboard = () => {
    if (isSuperAdmin) return;
    setSelectedKeys(["dashboard"]);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(selectedKeys);
      }}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Menu permissions
          </p>
          <p className="mt-1 text-sm text-muted">
            {isSuperAdmin
              ? "Super admins always have full access."
              : `${selectedKeys.length} menu${selectedKeys.length === 1 ? "" : "s"} enabled.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="button button-secondary button-compact"
            disabled={isSuperAdmin}
            onClick={clearToDashboard}
          >
            Dashboard only
          </button>
          <button
            type="button"
            className="button button-secondary button-compact"
            disabled={isSuperAdmin}
            onClick={selectAllMenus}
          >
            Select all
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ADMIN_MENU_OPTIONS.map((group) => {
          const groupKeys = group.items.map((item) => item.key);
          const isGroupSelected = groupKeys.every((key) =>
            selectedKeySet.has(key),
          );

          return (
            <section
              key={group.group}
              className="rounded-lg border border-border bg-surface"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-bold text-foreground">
                  {group.group}
                </h2>
                <button
                  type="button"
                  className="button button-secondary button-compact"
                  disabled={isSuperAdmin}
                  onClick={() => toggleGroup(group.items)}
                >
                  {isGroupSelected ? "Remove group" : "Add group"}
                </button>
              </div>

              <div className="divide-y divide-border">
                {group.items.map((item) => {
                  const isSelected = selectedKeySet.has(item.key);

                  return (
                    <label
                      key={item.key}
                      className={`flex min-h-20 items-start gap-3 px-4 py-3 transition-colors ${
                        isSuperAdmin
                          ? "cursor-not-allowed bg-surface-muted/40"
                          : "cursor-pointer hover:bg-surface-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        disabled={isSuperAdmin}
                        onChange={() => toggleKey(item.key)}
                      />
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-brand bg-brand text-white"
                            : "border-border-strong bg-surface"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check size={14} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        {isSuperAdmin && (
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <LockKeyhole size={16} />
            Super admin permissions are locked.
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:ml-auto sm:flex-row">
          {secondaryAction}
          <button
            type="submit"
            className="button button-primary"
            disabled={isSuperAdmin}
          >
            <Save size={16} />
            Save access
          </button>
        </div>
      </div>
    </form>
  );
}
