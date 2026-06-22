"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  ListChecks,
  Layers3,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import {
  PACKAGE_STATUS_OPTIONS,
  formatPackageCurrency,
} from "@/lib/packageInfoData";
import { usePackageInfoManagement } from "@/hooks/usePackageInfoManagement";
import { PackageInfoModal } from "./PackageInfoModal";

const statusBadgeClassNames = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

function getPermissionGroups(permissions) {
  const groupMap = new Map();

  permissions.forEach((permission, index) => {
    const [area = "Access", type = "General"] = permission.path;
    const key = `${area}-${type}`;
    const existingGroup = groupMap.get(key);
    const nextItem = { ...permission, index };

    if (existingGroup) {
      existingGroup.items.push(nextItem);
      return;
    }

    groupMap.set(key, {
      key,
      area,
      type,
      items: [nextItem],
    });
  });

  return Array.from(groupMap.values());
}

function PackageMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-white/80 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function PackageCard({ packageInfo, onDelete, onEdit, onStatusChange }) {
  const isActive = packageInfo.status === "active";
  const permissionGroups = useMemo(
    () => getPermissionGroups(packageInfo.permissions),
    [packageInfo.permissions],
  );

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="grid min-h-[34rem] lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col justify-between bg-[#111827] p-5 text-white">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white">
                {packageInfo.imageUrl ? (
                  <Image
                    src={packageInfo.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PackagePlus size={26} className="text-brand" />
                )}
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
                  statusBadgeClassNames[packageInfo.status] ||
                  statusBadgeClassNames.archived
                }`}
              >
                {packageInfo.status}
              </span>
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
              Package price
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-black leading-none">
                {Number(packageInfo.price || 0).toLocaleString("en-BD")}
              </span>
              <span className="pb-1 text-sm font-bold text-slate-300">
                {packageInfo.currency}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
              <CalendarDays size={17} className="text-brand-accent" />
              <span className="text-sm font-semibold">
                {packageInfo.validityDays} days validity
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
              <Layers3 size={17} className="text-brand-accent" />
              <span className="text-sm font-semibold">
                {packageInfo.packageType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-black leading-tight text-foreground">
                {packageInfo.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                {packageInfo.summary}
              </p>
              {packageInfo.packageTypeNote && (
                <p className="mt-3 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
                  {packageInfo.packageTypeNote}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusToggle
                checked={isActive}
                label={`Set ${packageInfo.title} active status`}
                onChange={(checked) =>
                  onStatusChange(packageInfo, checked ? "active" : "draft")
                }
              />
              <button
                type="button"
                className="icon-button h-9 w-9 border border-border"
                onClick={() => onEdit(packageInfo)}
                aria-label={`Edit ${packageInfo.title}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                className="icon-button h-9 w-9 border border-rose-200 text-danger hover:bg-rose-50 hover:text-danger"
                onClick={() => onDelete(packageInfo)}
                aria-label={`Delete ${packageInfo.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PackageMetric
              icon={Users}
              label="Purchased"
              value={`${packageInfo.totalPurchased} students`}
            />
            <PackageMetric
              icon={ShoppingBag}
              label="Sell amount"
              value={formatPackageCurrency(
                packageInfo.totalSellAmount,
                packageInfo.currency,
              )}
            />
            <PackageMetric
              icon={FileText}
              label="Rules"
              value={`${packageInfo.rules.length} conditions`}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <PackageMetric
              icon={ListChecks}
              label="Permissions"
              value={`${packageInfo.permissions.length} entries`}
            />
            <PackageMetric
              icon={CheckCircle2}
              label="Access groups"
              value={`${permissionGroups.length} groups`}
            />
            <PackageMetric
              icon={Layers3}
              label="Primary scope"
              value={permissionGroups[0]?.area || "General"}
            />
          </div>

          {packageInfo.url && (
            <a
              href={packageInfo.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-semibold text-brand-strong transition-colors hover:bg-brand-soft"
            >
              <ExternalLink size={15} className="shrink-0" />
              <span className="truncate">{packageInfo.url}</span>
            </a>
          )}

          <div className="mt-6 grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CircleDollarSign size={17} className="text-brand-strong" />
                <h3 className="text-sm font-bold text-foreground">
                  Applied conditions
                </h3>
              </div>
              <div className="space-y-2">
                {packageInfo.rules.map((rule, index) => (
                  <div
                    key={`${packageInfo.id}-rule-${rule}`}
                    className="flex gap-3 rounded-lg border border-border bg-surface-muted px-3 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-brand-strong">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-foreground">{rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">
                    Exams and access
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {packageInfo.permissions.length} permissions
                </span>
              </div>

              <div className="max-h-[27rem] space-y-3 overflow-y-auto pr-1">
                {permissionGroups.map((group) => (
                  <div
                    key={`${packageInfo.id}-${group.key}`}
                    className="overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50/60"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-white/80 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-foreground">
                          {group.area} / {group.type}
                        </p>
                        <p className="text-xs font-semibold text-muted">
                          {group.items.length} permitted item
                          {group.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                        {group.items.length}
                      </span>
                    </div>

                    <div className="divide-y divide-emerald-100">
                      {group.items.map((item) => {
                        const detail = item.path.slice(2).join(" / ");

                        return (
                          <div
                            key={`${packageInfo.id}-${group.key}-${item.index}`}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
                          >
                            <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                              {detail || item.path.join(" / ")}
                            </p>
                            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-emerald-700">
                              {item.permission}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PackageInfoManager({ initialPackages }) {
  const {
    createPackage,
    deletePackage,
    packages,
    totals,
    updatePackage,
    updatePackageStatus,
  } = usePackageInfoManagement(initialPackages);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    packageInfo: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredPackages = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return packages.filter((packageInfo) => {
      const matchesSearch =
        !query ||
        [
          packageInfo.title,
          packageInfo.summary,
          packageInfo.packageType,
          packageInfo.packageTypeNote,
          packageInfo.url,
          packageInfo.permissions
            .map((item) => `${item.path.join(" ")} ${item.permission}`)
            .join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" || packageInfo.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearchQuery, packages, statusFilter]);

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", packageInfo: null });
  };

  const openEditModal = (packageInfo) => {
    setModalState({ isOpen: true, mode: "edit", packageInfo });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleSubmit = (packageInput) => {
    if (modalState.mode === "edit" && modalState.packageInfo) {
      const updatedPackage = updatePackage(
        modalState.packageInfo.id,
        packageInput,
      );
      toast.success(`${updatedPackage.title} updated.`);
      return;
    }

    const createdPackage = createPackage(packageInput);
    toast.success(`${createdPackage.title} created.`);
  };

  const handleDelete = (packageInfo) => {
    const confirmed = window.confirm(`Delete ${packageInfo.title}?`);
    if (!confirmed) return;

    const deleted = deletePackage(packageInfo.id);
    if (deleted) {
      toast.success(`${packageInfo.title} deleted.`);
      return;
    }

    toast.error("Package could not be deleted.");
  };

  const handleStatusChange = (packageInfo, status) => {
    const updatedPackage = updatePackageStatus(packageInfo.id, status);
    toast.success(`${updatedPackage.title} marked ${status}.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Package Info
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Package rules, pricing and exam access
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Review every commercial package in a single card: price, validity,
            package conditions, allowed materials and included exams.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.active}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Students</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.students}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Revenue</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {formatPackageCurrency(totals.revenue)}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_14rem_auto_auto] lg:items-end">
          <label className="field-group">
            <span className="field-label">Search packages</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search title, type, rule, or URL..."
                aria-label="Search packages"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={PACKAGE_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(option) => setStatusFilter(option.value)}
            placeholder="All statuses"
          />

          <button
            type="button"
            className="button button-secondary min-h-11"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            className="button button-primary min-h-11"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Create package
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        {filteredPackages.length > 0 ? (
          filteredPackages.map((packageInfo) => (
            <PackageCard
              key={packageInfo.id}
              packageInfo={packageInfo}
              onDelete={handleDelete}
              onEdit={openEditModal}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="surface-card px-5 py-14 text-center">
            <p className="font-bold text-foreground">No packages found</p>
            <p className="mt-1 text-sm text-muted">
              Adjust the filters or create a new package.
            </p>
          </div>
        )}
      </section>

      <PackageInfoModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        packageInfo={modalState.packageInfo}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
