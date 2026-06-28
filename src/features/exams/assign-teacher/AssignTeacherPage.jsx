"use client";

import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { TextInput } from "@/components/ui/forms/TextInput";
import { mockTeachers } from "@/features/exams/assign-teacher/mockAssignTeacherData";
import { ArrowLeft, ChevronDown, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Watching: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function splitPapers(totalPapers, teachers) {
  if (totalPapers <= 0 || teachers.length === 0) {
    return teachers.map((teacher) => ({ ...teacher, start: null, end: null, count: 0 }));
  }

  const baseCount = Math.floor(totalPapers / teachers.length);
  const remainder = totalPapers % teachers.length;
  let nextStart = 1;

  return teachers.map((teacher, index) => {
    const count = baseCount + (index < remainder ? 1 : 0);
    const start = count > 0 ? nextStart : null;
    const end = count > 0 ? nextStart + count - 1 : null;
    nextStart += count;
    return { ...teacher, start, end, count };
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
        STATUS_STYLES[status] || STATUS_STYLES.Pending
      }`}
    >
      {status}
    </span>
  );
}

function TeacherDropdown({ selectedIds, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCount = selectedIds.length;

  return (
    <div className="field-group relative">
      <span className="field-label">Teachers</span>
      <button
        type="button"
        className="field-shell min-h-11 w-full px-3 text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Users size={16} className="mr-2.5 shrink-0 text-muted" />
        <span className="field-input flex-1 truncate">
          {selectedCount ? `${selectedCount} teachers selected` : "Select teachers"}
        </span>
        <ChevronDown
          size={16}
          className={`ml-2 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-xl">
          {mockTeachers.map((teacher) => {
            const checked = selectedIds.includes(teacher.id);
            return (
              <label
                key={teacher.id}
                className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(teacher.id)}
                  className="mt-1 h-4 w-4 rounded border-border text-brand"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">
                    {teacher.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {teacher.subject}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentSummary({ assignments, totalPapers }) {
  const assignedCount = assignments.reduce(
    (total, assignment) => total + assignment.count,
    0,
  );

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Papers
        </p>
        <p className="mt-2 text-2xl font-black text-foreground">{totalPapers}</p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Teachers
        </p>
        <p className="mt-2 text-2xl font-black text-foreground">
          {assignments.length}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Assigned
        </p>
        <p className="mt-2 text-2xl font-black text-foreground">
          {assignedCount}
        </p>
      </div>
    </section>
  );
}

export function AssignTeacherPage({ examId }) {
  const [totalPapers, setTotalPapers] = useState(60);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([
    "teacher-001",
    "teacher-002",
    "teacher-003",
  ]);
  const [assignedTeacherIds, setAssignedTeacherIds] = useState(selectedTeacherIds);

  const selectedTeachers = useMemo(
    () =>
      mockTeachers.filter((teacher) => selectedTeacherIds.includes(teacher.id)),
    [selectedTeacherIds],
  );
  const assignedTeachers = useMemo(
    () =>
      mockTeachers.filter((teacher) => assignedTeacherIds.includes(teacher.id)),
    [assignedTeacherIds],
  );
  const previewAssignments = useMemo(
    () => splitPapers(Math.max(0, Number(totalPapers) || 0), selectedTeachers),
    [selectedTeachers, totalPapers],
  );
  const activeAssignments = useMemo(
    () => splitPapers(Math.max(0, Number(totalPapers) || 0), assignedTeachers),
    [assignedTeachers, totalPapers],
  );

  const toggleTeacher = (teacherId) => {
    setSelectedTeacherIds((currentIds) =>
      currentIds.includes(teacherId)
        ? currentIds.filter((id) => id !== teacherId)
        : [...currentIds, teacherId],
    );
  };

  const assignPapers = () => {
    if (selectedTeacherIds.length === 0) {
      toast.error("Select at least one teacher.");
      return;
    }

    setAssignedTeacherIds(selectedTeacherIds);
    toast.success("Papers assigned sequentially.");
  };

  return (
    <div className="mx-auto flex w-full max-w-8xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href="/exams/written-exams" className="back-link">
          <ArrowLeft size={16} />
          Back to exams
        </Link>
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Mock paper allocation
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Assign teacher
          </h1>
          <p className="mt-1 text-sm text-muted">Exam ID: {examId}</p>
        </div>
      </div>

      <section className="surface-card p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(12rem,16rem)_minmax(18rem,1fr)_auto] lg:items-end">
          <TextInput
            label="Total student papers"
            name="totalPapers"
            type="number"
            min="0"
            icon={ClipboardList}
            value={String(totalPapers)}
            onChange={(event) =>
              setTotalPapers(Math.max(0, Number(event.target.value) || 0))
            }
          />
          <TeacherDropdown
            selectedIds={selectedTeacherIds}
            onToggle={toggleTeacher}
          />
          <button
            type="button"
            className="button button-primary min-h-11"
            onClick={assignPapers}
          >
            Assign papers
          </button>
        </div>
      </section>

      <AssignmentSummary
        assignments={activeAssignments}
        totalPapers={Math.max(0, Number(totalPapers) || 0)}
      />

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Assignment preview
          </h2>
          <p className="mt-1 text-sm text-muted">
            Papers are split in selected teacher order. Extra papers are added
            to the first teachers.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHead>
              <tr>
                <TableTh>Teacher</TableTh>
                <TableTh>Paper range</TableTh>
                <TableTh>Paper count</TableTh>
                <TableTh>Activity status</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {(activeAssignments.length ? activeAssignments : previewAssignments).map(
                (assignment) => (
                  <TableRow key={assignment.id}>
                    <TableTd>
                      <p className="font-semibold text-foreground">
                        {assignment.name}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {assignment.subject}
                      </p>
                    </TableTd>
                    <TableTd className="font-semibold text-foreground">
                      {assignment.count > 0
                        ? `${assignment.start}-${assignment.end}`
                        : "No papers"}
                    </TableTd>
                    <TableTd>{assignment.count}</TableTd>
                    <TableTd>
                      <StatusBadge status={assignment.activity} />
                    </TableTd>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </div>
  );
}
