"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { Pagination } from "@/components/ui/Pagination";
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
import { useExamTypeManagement } from "@/hooks/useExamTypeManagement";
import {
  formatExamTypeDate,
  isExamTypeIconImage,
} from "@/lib/examTypeData";
import {
  ClipboardList,
  Eye,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExamTypeModal } from "./ExamTypeModal";

const ITEMS_PER_PAGE = 2;

function ExamTypeIcon({ examType }) {
  if (isExamTypeIconImage(examType.icon)) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
        <Image
          src={examType.icon}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  if (examType.icon) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft px-2 text-xs font-black text-brand-strong">
        <span className="max-w-full truncate">{examType.icon}</span>
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
      <Layers3 size={18} />
    </span>
  );
}

function ExamTypeActionMenu({ examType, onDelete }) {
  const actionLinks = [
    {
      href: `/exam-types/${examType.id}/view`,
      label: "View",
      icon: Eye,
    },
    {
      href: `/exam-types/${examType.id}/edit`,
      label: "Edit",
      icon: Pencil,
    },
  ];

  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${examType.name}`}
      menuHeight={136}
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
            onClick={() => {
              closeMenu();
              onDelete(examType);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </>
      )}
    </FloatingActionMenu>
  );
}

export function ExamTypeManager({ initialExamTypes }) {
  const { createExamType, deleteExamType, examTypes } =
    useExamTypeManagement(initialExamTypes);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    examType: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredExamTypes = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) return examTypes;

    return examTypes.filter((examType) =>
      [examType.id, examType.name, examType.icon]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearchQuery, examTypes]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExamTypes.length / ITEMS_PER_PAGE),
  );

  const activePage = Math.min(currentPage, totalPages);

  const paginatedExamTypes = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredExamTypes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activePage, filteredExamTypes]);

  const handleSearchChange = (nextSearchQuery) => {
    setSearchQuery(nextSearchQuery);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", examType: null });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleCreate = (examTypeInput) => {
    const createdExamType = createExamType(examTypeInput);
    toast.success(`${createdExamType.name} created.`);
    resetFilters();
  };

  const handleDelete = (examType) => {
    const confirmed = window.confirm(`Delete ${examType.name}?`);
    if (!confirmed) return;

    const deletedExamType = deleteExamType(examType.id);
    if (deletedExamType) {
      toast.success(`${examType.name} deleted.`);
      return;
    }

    toast.error("Exam type could not be deleted.");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Exam types
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Manage the top-level exam labels used when creating packages,
            materials, questions, and student exam activity.
          </p>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Total types</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {examTypes.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Visible</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {filteredExamTypes.length}
            </p>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Exam type list
              </h2>
              <p className="text-sm text-muted">
                {filteredExamTypes.length} of {examTypes.length} exam types
                shown
              </p>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Create exam type
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-end">
            <CustomSearch
              placeholder="Search by name, ID, or icon..."
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              ariaLabel="Search exam types"
              wide
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
                <TableTh>Exam type</TableTh>
                <TableTh>Created</TableTh>
                <TableTh>Updated</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {paginatedExamTypes.length > 0 ? (
                paginatedExamTypes.map((examType, index) => (
                  <TableRow key={examType.id}>
                    <TableTd className="font-mono text-xs text-muted">
                        {String(
                        (activePage - 1) * ITEMS_PER_PAGE + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-64 items-center gap-3">
                        <ExamTypeIcon examType={examType} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {examType.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted">
                            ID: {examType.id}
                          </p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="min-w-44 text-sm font-semibold text-foreground">
                      {formatExamTypeDate(examType.createdAt)}
                    </TableTd>
                    <TableTd className="min-w-44 text-sm text-muted">
                      {formatExamTypeDate(examType.updatedAt)}
                    </TableTd>
                    <TableTd>
                      <ExamTypeActionMenu
                        examType={examType}
                        onDelete={handleDelete}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={5} className="py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <ClipboardList size={20} />
                    </div>
                    <p className="mt-3 font-semibold text-foreground">
                      No exam types found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search query or create a new exam type.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>

        <Pagination
          currentPage={activePage}
          totalItems={filteredExamTypes.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </TableContainer>

      <ExamTypeModal
        examType={modalState.examType}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={closeModal}
        onSubmit={handleCreate}
      />
    </div>
  );
}
