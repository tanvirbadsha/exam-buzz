"use client";

import {
  CalendarClock,
  Download,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useClassRoutineManagement } from "@/hooks/useClassRoutineManagement";
import {
  ROUTINE_TYPES,
  formatRoutineFileSize,
  formatRoutineUpdatedAt,
} from "@/lib/classRoutineData";
import { ClassRoutineModal } from "./ClassRoutineModal";

function StatusBadge({ status }) {
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function RoutineCard({
  routine,
  routineType,
  onDelete,
  onEdit,
  onStatusChange,
  onUpload,
}) {
  if (!routine) {
    return (
      <article className="surface-card flex min-h-80 flex-col justify-between p-5">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
            <CalendarClock size={22} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-foreground">
            {routineType.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {routineType.description}
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center">
            <p className="font-semibold text-foreground">No routine found</p>
            <p className="mt-1 text-sm text-muted">
              Upload the PDF routine for this exam type.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="button button-primary mt-5 w-full"
          onClick={() => onUpload(routineType.value)}
        >
          <Plus size={16} />
          Upload Routine
        </button>
      </article>
    );
  }

  return (
    <article className="surface-card flex min-h-80 flex-col justify-between overflow-hidden">
      <div className="border-b border-border bg-surface-muted px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-strong">
              {routineType.label}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              {routine.title}
            </h2>
          </div>
          <StatusBadge status={routine.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {routine.fileName}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatRoutineFileSize(routine.fileSize)}
              </p>
            </div>
            {routine.fileUrl && (
              <a
                href={routine.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="icon-button h-9 w-9 border border-border"
                aria-label={`Preview ${routine.title}`}
              >
                <Download size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Updated
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatRoutineUpdatedAt(routine.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <StatusToggle
            checked={routine.status === "active"}
            label={`Set ${routine.title} active status`}
            onChange={(checked) =>
              onStatusChange(routine, checked ? "active" : "inactive")
            }
          />
          <span className="text-sm font-semibold text-muted">
            {routine.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="button button-secondary button-compact"
            onClick={() => onEdit(routine)}
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            type="button"
            className="button button-secondary button-compact text-danger hover:bg-rose-50"
            onClick={() => onDelete(routine)}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export function ClassRoutineManager({ initialRoutines }) {
  const {
    deleteRoutine,
    routineByType,
    routines,
    updateRoutineStatus,
    upsertRoutine,
  } = useClassRoutineManagement(initialRoutines);
  const [modalState, setModalState] = useState({
    examType: "preliminary",
    isOpen: false,
    mode: "create",
    routine: null,
  });

  const openCreateModal = (examType) => {
    setModalState({
      examType,
      isOpen: true,
      mode: "create",
      routine: null,
    });
  };

  const openEditModal = (routine) => {
    setModalState({
      examType: routine.examType,
      isOpen: true,
      mode: "edit",
      routine,
    });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleSubmit = (routineInput) => {
    const savedRoutine = upsertRoutine(routineInput);
    toast.success(`${savedRoutine.title} saved.`);
  };

  const handleDelete = (routine) => {
    const confirmed = window.confirm(`Delete ${routine.title}?`);
    if (!confirmed) return;

    const deleted = deleteRoutine(routine.examType);
    if (deleted) {
      toast.success(`${routine.title} deleted.`);
      return;
    }

    toast.error("Routine could not be deleted.");
  };

  const handleStatusChange = (routine, status) => {
    const updatedRoutine = updateRoutineStatus(routine.examType, status);
    toast.success(`${updatedRoutine.title} marked ${status}.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam scheduling
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Class Routine
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Upload and manage the PDF routines shown to preliminary and written
            exam students.
          </p>
        </div>
        <div className="surface-card px-4 py-3">
          <p className="text-xs font-semibold text-muted">Uploaded routines</p>
          <p className="mt-1 text-xl font-black text-foreground">
            {routines.length} / {ROUTINE_TYPES.length}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {ROUTINE_TYPES.map((routineType) => (
          <RoutineCard
            key={routineType.value}
            routineType={routineType}
            routine={routineByType.get(routineType.value)}
            onDelete={handleDelete}
            onEdit={openEditModal}
            onStatusChange={handleStatusChange}
            onUpload={openCreateModal}
          />
        ))}
      </section>

      <ClassRoutineModal
        examType={modalState.examType}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        routine={modalState.routine}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
