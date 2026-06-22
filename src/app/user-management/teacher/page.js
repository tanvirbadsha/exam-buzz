"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableResponsive,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { CreateTeacherModal } from "@/features/users/teacher/CreateTeacherModal";
import { PermissionTags } from "@/features/users/teacher/PermissionTags";
import { TeacherActionMenu } from "@/features/users/teacher/TeacherActionMenu";
import { useTeacherManagement } from "@/hooks/useTeacherManagement";
import { TEACHER_PERMISSION_OPTIONS, formatCurrency } from "@/lib/teacherData";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";

const permissionOptions = [
  { label: "All permissions", value: "all" },
  ...TEACHER_PERMISSION_OPTIONS.map((permission) => ({
    label: permission,
    value: permission,
  })),
];

const sortableColumns = [
  { label: "Total Withdrawal", key: "totalWithdrawal", align: "right" },
  { label: "Total Earning", key: "totalEarning", align: "right" },
  { label: "Pending Withdrawal", key: "pendingWithdrawal", align: "right" },
  { label: "Total Assesment", key: "totalAssessment", align: "right" },
];

function SortableHeader({ label, sortKey, activeSort, onSort }) {
  const isActive = activeSort.key === sortKey;
  const Icon = !isActive
    ? ChevronsUpDown
    : activeSort.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-end gap-1.5 text-right transition-colors hover:text-foreground"
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      <Icon size={13} />
    </button>
  );
}

export default function TeacherManagementPage() {
  const { teachers, createTeacher, deleteTeacher } = useTeacherManagement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionFilter, setPermissionFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "totalEarning",
    direction: "desc",
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredTeachers = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !query ||
        [teacher.fullName, teacher.phone, teacher.email]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesPermission =
        permissionFilter === "all" ||
        teacher.permissions.includes(permissionFilter);

      return matchesSearch && matchesPermission;
    });
  }, [deferredSearchQuery, permissionFilter, teachers]);

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? 0;
      const bValue = b[sortConfig.key] ?? 0;
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (aValue === bValue) {
        return a.fullName.localeCompare(b.fullName);
      }

      return (aValue - bValue) * direction;
    });
  }, [filteredTeachers, sortConfig]);

  const handleSort = (sortKey) => {
    setSortConfig((currentSort) => {
      if (currentSort.key !== sortKey) {
        return { key: sortKey, direction: "desc" };
      }

      return {
        key: sortKey,
        direction: currentSort.direction === "desc" ? "asc" : "desc",
      };
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setPermissionFilter("all");
    setSortConfig({ key: "totalEarning", direction: "desc" });
  };

  const handleCreate = (teacherInput) => {
    const createdTeacher = createTeacher(teacherInput);
    toast.success(`${createdTeacher.fullName} created.`);
  };

  const handleDelete = (teacher) => {
    const confirmed = window.confirm(`Delete ${teacher.fullName}?`);
    if (!confirmed) return;

    const deleted = deleteTeacher(teacher.id);
    if (deleted) {
      toast.success(`${teacher.fullName} deleted.`);
      return;
    }

    toast.error("Teacher could not be deleted.");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            User management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Teacher accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage teacher accounts, exam permissions, earnings, withdrawals,
            and assessment activity.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          Create teacher
        </button>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Teacher list
              </h2>
              <p className="text-sm text-muted">
                {sortedTeachers.length} of {teachers.length} teachers shown
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_16rem_auto] lg:items-end">
            <CustomSearch
              placeholder="Search by name, phone, or email..."
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              ariaLabel="Search teachers"
              wide
            />
            <CustomDropdown
              label="Permission"
              options={permissionOptions}
              value={permissionFilter}
              onChange={(option) => setPermissionFilter(option.value)}
              placeholder="All permissions"
            />
            <button
              type="button"
              className="button button-secondary min-h-10 lg:self-end"
              onClick={resetFilters}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Phone</TableTh>
                <TableTh>Permission</TableTh>
                {sortableColumns.map((column) => (
                  <TableTh key={column.key} className="text-right">
                    <SortableHeader
                      label={column.label}
                      sortKey={column.key}
                      activeSort={sortConfig}
                      onSort={handleSort}
                    />
                  </TableTh>
                ))}
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {sortedTeachers.length > 0 ? (
                sortedTeachers.map((teacher, index) => (
                  <TableRow key={teacher.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="min-w-44">
                        <p className="font-semibold text-foreground">
                          {teacher.fullName}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-sm text-muted">
                          {teacher.phone}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd>
                      <PermissionTags permissions={teacher.permissions} />
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-right font-semibold text-foreground">
                      {formatCurrency(teacher.totalWithdrawal)}
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-right font-semibold text-foreground">
                      {formatCurrency(teacher.totalEarning)}
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-right font-semibold text-foreground">
                      {formatCurrency(teacher.pendingWithdrawal)}
                    </TableTd>
                    <TableTd className="text-right font-semibold text-foreground">
                      {teacher.totalAssessment}
                    </TableTd>
                    <TableTd>
                      <TeacherActionMenu
                        teacher={teacher}
                        onDelete={handleDelete}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={8} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No teachers found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a new teacher.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <CreateTeacherModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
