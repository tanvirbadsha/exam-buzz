"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CreateStudentModal } from "@/components/student/CreateStudentModal";
import { StudentActionMenu } from "@/components/student/StudentActionMenu";
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
import { StatusToggle } from "@/components/ui/StatusToggle";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import {
  STUDENT_PACKAGE_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  formatStudentCurrency,
} from "@/lib/studentData";

const sortableColumns = [
  { label: "Purchased Package", key: "purchasedPackageCount" },
  { label: "Purchase Amount", key: "purchaseAmount" },
  { label: "Preliminary Exam", key: "preliminaryExam" },
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

export default function StudentManagementPage() {
  const {
    createStudent,
    deleteStudent,
    students,
    updateStudentStatus,
  } = useStudentManagement();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "purchaseAmount",
    direction: "desc",
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredStudents = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.userId,
          student.phone,
          student.registrationId,
          student.purchasedPackage,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesPackage =
        packageFilter === "all" || student.purchasedPackage === packageFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.isActive) ||
        (statusFilter === "inactive" && !student.isActive);

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [deferredSearchQuery, packageFilter, statusFilter, students]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? 0;
      const bValue = b[sortConfig.key] ?? 0;
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (aValue === bValue) {
        return a.name.localeCompare(b.name);
      }

      return (aValue - bValue) * direction;
    });
  }, [filteredStudents, sortConfig]);

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
    setPackageFilter("all");
    setStatusFilter("all");
    setSortConfig({ key: "purchaseAmount", direction: "desc" });
  };

  const handleCreate = (studentInput) => {
    const createdStudent = createStudent(studentInput);
    toast.success(`${createdStudent.name} created.`);
  };

  const handleDelete = (student) => {
    const confirmed = window.confirm(`Delete ${student.name}?`);
    if (!confirmed) return;

    const deleted = deleteStudent(student.id);
    if (deleted) {
      toast.success(`${student.name} deleted.`);
      return;
    }

    toast.error("Student could not be deleted.");
  };

  const handleStatusChange = (student, isActive) => {
    const updatedStudent = updateStudentStatus(student.id, isActive);
    toast.success(
      `${updatedStudent.name} marked ${isActive ? "active" : "inactive"}.`,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            User management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Student accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create students, review purchases and exam activity, and control
            active access status.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          Create student
        </button>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Student list
              </h2>
              <p className="text-sm text-muted">
                {sortedStudents.length} of {students.length} students shown
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(18rem,1fr)_15rem_12rem_auto] xl:items-end">
            <CustomSearch
              placeholder="Search by name, user ID, phone, or registration..."
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              ariaLabel="Search students"
              wide
            />
            <CustomDropdown
              label="Package"
              options={STUDENT_PACKAGE_OPTIONS}
              value={packageFilter}
              onChange={(option) => setPackageFilter(option.value)}
              placeholder="All packages"
            />
            <CustomDropdown
              label="Status"
              options={STUDENT_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(option) => setStatusFilter(option.value)}
              placeholder="All statuses"
            />
            <button
              type="button"
              className="button button-secondary min-h-10 xl:self-end"
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
                <TableTh>Name</TableTh>
                <TableTh>User ID</TableTh>
                <TableTh>Phone</TableTh>
                <TableTh>Registration ID</TableTh>
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
                <TableTh className="text-right">Written Exam</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {sortedStudents.length > 0 ? (
                sortedStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </TableTd>
                    <TableTd className="min-w-44 font-semibold text-foreground">
                      {student.name}
                    </TableTd>
                    <TableTd className="whitespace-nowrap font-mono text-xs text-muted">
                      {student.userId}
                    </TableTd>
                    <TableTd className="whitespace-nowrap">
                      {student.phone}
                    </TableTd>
                    <TableTd className="whitespace-nowrap font-mono text-xs text-muted">
                      {student.registrationId}
                    </TableTd>
                    <TableTd className="text-right">
                      <div className="min-w-36">
                        <p className="font-semibold text-foreground">
                          {student.purchasedPackageCount}
                        </p>
                        <p className="mt-1 text-xs font-medium text-muted">
                          {student.purchasedPackage}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd className="whitespace-nowrap text-right font-semibold text-foreground">
                      {formatStudentCurrency(student.purchaseAmount)}
                    </TableTd>
                    <TableTd className="text-right font-semibold text-foreground">
                      {student.preliminaryExam}
                    </TableTd>
                    <TableTd className="text-right font-semibold text-foreground">
                      {student.writtenExam}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-24 items-center gap-2">
                        <StatusToggle
                          checked={student.isActive}
                          label={`Set ${student.name} status`}
                          onChange={(isActive) =>
                            handleStatusChange(student, isActive)
                          }
                        />
                        <span
                          className={`text-xs font-bold ${
                            student.isActive
                              ? "text-emerald-700"
                              : "text-muted"
                          }`}
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <StudentActionMenu
                        student={student}
                        onDelete={handleDelete}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={11} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No students found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a new student.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <CreateStudentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
