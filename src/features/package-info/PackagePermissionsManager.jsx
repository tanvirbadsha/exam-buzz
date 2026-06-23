"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FolderTree,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { HierarchicalSubjectDropdown } from "@/features/subjects/HierarchicalSubjectDropdown";
import { usePackageInfoManagement } from "@/hooks/usePackageInfoManagement";

const SUBJECT_PERMISSION_TREE = [
  {
    label: "BCS",
    children: [
      {
        label: "Preliminary",
        children: [
          { label: "46th BCS Preliminary" },
          { label: "47th BCS Preliminary" },
          { label: "48th BCS Preliminary" },
        ],
      },
      {
        label: "Written",
        children: [
          { label: "46th BCS Written" },
          { label: "47th BCS Written" },
          { label: "48th BCS Written" },
        ],
      },
      {
        label: "Viva",
        children: [{ label: "46th BCS Viva" }, { label: "47th BCS Viva" }],
      },
    ],
  },
  {
    label: "Bank Jobs",
    children: [
      {
        label: "Preliminary",
        children: [
          { label: "Officer Cash Preliminary" },
          { label: "Senior Officer Preliminary" },
          { label: "Combined Bank Preliminary" },
        ],
      },
      {
        label: "Written",
        children: [
          { label: "Officer Cash Written" },
          { label: "Senior Officer Written" },
          { label: "Combined Bank Written" },
        ],
      },
    ],
  },
  {
    label: "Model Test",
    children: [
      { label: "Limited 20 exams" },
      { label: "Limited 30 exams" },
      { label: "Full syllabus exams" },
    ],
  },
];

const MATERIAL_PERMISSION_TREE = [
  {
    label: "Material",
    children: [
      {
        label: "BCS",
        children: [
          { label: "Preliminary question bank" },
          { label: "Written answer format" },
          { label: "Current affairs sheet" },
        ],
      },
      {
        label: "Bank",
        children: [
          { label: "Weekly sheets" },
          { label: "Written routine" },
          { label: "Math shortcut notes" },
        ],
      },
      {
        label: "Recorded Class",
        children: [
          { label: "Revision classes" },
          { label: "Problem solving classes" },
        ],
      },
    ],
  },
];

function walkPermissionTree(nodes, depth = 0, parentPath = [], options = []) {
  nodes.forEach((node) => {
    const path = [...parentPath, node.label];
    options.push({
      label: node.label,
      value: path.join("::"),
      depth,
      meta: path.join(" / "),
      searchText: path.join(" "),
      path,
    });

    if (node.children?.length) {
      walkPermissionTree(node.children, depth + 1, path, options);
    }
  });

  return options;
}

function optionFromPermission(permission) {
  const path = Array.isArray(permission.path) ? permission.path : [];
  return {
    label: path.at(-1) || "Permission",
    value: path.join("::"),
    depth: Math.max(path.length - 1, 0),
    meta: path.join(" / "),
    searchText: path.join(" "),
    path,
  };
}

function buildPermissionOptions(baseTree, permissions, predicate) {
  const optionMap = new Map();

  walkPermissionTree(baseTree).forEach((option) => {
    optionMap.set(option.value, option);
  });

  permissions.filter(predicate).forEach((permission) => {
    const option = optionFromPermission(permission);
    if (option.path.length > 0) {
      optionMap.set(option.value, option);
    }
  });

  return Array.from(optionMap.values());
}

function getPermissionKey(permission) {
  return Array.isArray(permission.path)
    ? permission.path.join("::")
    : String(permission.path || "");
}

function PermissionList({ permissions, onRemove }) {
  if (permissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted px-4 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          No permissions selected
        </p>
        <p className="mt-1 text-xs text-muted">
          Use the subject or material dropdown to add package access.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {permissions.map((permission) => (
        <div
          key={getPermissionKey(permission)}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {permission.path.join(" / ")}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {permission.permission}
            </p>
          </div>
          <button
            type="button"
            className="icon-button h-9 w-9 border border-rose-200 text-danger hover:bg-rose-50 hover:text-danger"
            onClick={() => onRemove(permission)}
            aria-label={`Remove ${permission.path.join(" / ")}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function PackagePermissionsManager({ initialPackages, packageId }) {
  const { packages, updatePackagePermissions } =
    usePackageInfoManagement(initialPackages);
  const packageInfo = useMemo(
    () => packages.find((item) => item.id === packageId) || null,
    [packageId, packages],
  );
  const [permissions, setPermissions] = useState(
    () => packageInfo?.permissions || [],
  );
  const [selectedSubjectValue, setSelectedSubjectValue] = useState("");
  const [selectedMaterialValue, setSelectedMaterialValue] = useState("");

  const subjectOptions = useMemo(
    () =>
      buildPermissionOptions(
        SUBJECT_PERMISSION_TREE,
        permissions,
        (permission) => permission.path?.[0] !== "Material",
      ),
    [permissions],
  );
  const materialOptions = useMemo(
    () =>
      buildPermissionOptions(
        MATERIAL_PERMISSION_TREE,
        permissions,
        (permission) => permission.path?.[0] === "Material",
      ),
    [permissions],
  );

  const addPermission = (option, permissionLabel) => {
    if (!option?.path?.length) return;

    const nextPermission = {
      path: option.path,
      permission: permissionLabel,
    };
    const nextPermissionKey = getPermissionKey(nextPermission);

    setPermissions((currentPermissions) => {
      const hasPermission = currentPermissions.some(
        (permission) => getPermissionKey(permission) === nextPermissionKey,
      );

      if (hasPermission) return currentPermissions;
      return [...currentPermissions, nextPermission];
    });
  };

  const removePermission = (targetPermission) => {
    const targetKey = getPermissionKey(targetPermission);
    setPermissions((currentPermissions) =>
      currentPermissions.filter(
        (permission) => getPermissionKey(permission) !== targetKey,
      ),
    );
  };

  const savePermissions = () => {
    if (!packageInfo) return;

    const updatedPackage = updatePackagePermissions(packageInfo.id, permissions);
    toast.success(`${updatedPackage.title} permissions updated.`);
  };

  if (!packageInfo) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <Link href="/package-management/packages" className="back-link">
          <ArrowLeft size={16} />
          Back to packages
        </Link>
        <div className="surface-card px-5 py-14 text-center">
          <p className="font-bold text-foreground">Package not found</p>
          <p className="mt-1 text-sm text-muted">
            The selected package is not available in this workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/package-management/packages" className="back-link">
            <ArrowLeft size={16} />
            Back to packages
          </Link>
          <p className="mt-4 text-sm font-semibold text-brand-strong">
            Package permissions
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            {packageInfo.title}
          </h1>
        </div>
        <button
          type="button"
          className="button button-primary sm:mt-9"
          onClick={savePermissions}
        >
          <Save size={16} />
          Save permissions
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <FolderTree size={17} className="text-brand-strong" />
            <h2 className="text-sm font-bold text-foreground">
              Subject and exam access
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <HierarchicalSubjectDropdown
              label="Subject"
              options={subjectOptions}
              value={selectedSubjectValue}
              onChange={(option) => {
                setSelectedSubjectValue(option.value);
                addPermission(option, "Included");
              }}
              placeholder="Select subject or exam"
              searchPlaceholder="Search subjects and exams..."
            />
            <button
              type="button"
              className="button button-secondary min-h-11"
              disabled={!selectedSubjectValue}
              onClick={() => setSelectedSubjectValue("")}
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>

        <div className="surface-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <FileCheck2 size={17} className="text-brand-strong" />
            <h2 className="text-sm font-bold text-foreground">
              Material access
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <HierarchicalSubjectDropdown
              label="Materials"
              options={materialOptions}
              value={selectedMaterialValue}
              onChange={(option) => {
                setSelectedMaterialValue(option.value);
                addPermission(option, "Permitted");
              }}
              placeholder="Select material"
              searchPlaceholder="Search materials..."
            />
            <button
              type="button"
              className="button button-secondary min-h-11"
              disabled={!selectedMaterialValue}
              onClick={() => setSelectedMaterialValue("")}
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-foreground">
              Selected permissions
            </h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {permissions.length} selected
          </span>
        </div>
        <PermissionList permissions={permissions} onRemove={removePermission} />
      </section>
    </div>
  );
}
