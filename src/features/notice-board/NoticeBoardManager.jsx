"use client";

import { BellRing, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { useNoticeBoardManagement } from "@/hooks/useNoticeBoardManagement";
import { NOTICE_STATUS_OPTIONS } from "@/lib/noticeBoardData";
import { NoticeBoardModal } from "./NoticeBoardModal";

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function NoticeActionMenu({ notice, onDelete, onEdit }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${notice.title}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(notice);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Pencil size={15} className="text-muted" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(notice);
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

export function NoticeBoardManager({ initialNotices }) {
  const {
    createNotice,
    deleteNotice,
    notices,
    totals,
    updateNotice,
    updateNoticeStatus,
  } = useNoticeBoardManagement(initialNotices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    notice: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredNotices = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesSearch =
        !query ||
        [notice.title, stripHtml(notice.description)]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" || notice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearchQuery, notices, statusFilter]);

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", notice: null });
  };

  const openEditModal = (notice) => {
    setModalState({ isOpen: true, mode: "edit", notice });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleSubmit = (noticeInput) => {
    if (modalState.mode === "edit" && modalState.notice) {
      const updatedNotice = updateNotice(modalState.notice.id, noticeInput);
      toast.success(`${updatedNotice.title} updated.`);
      return;
    }

    const createdNotice = createNotice(noticeInput);
    toast.success(`${createdNotice.title} created.`);
  };

  const handleDelete = (notice) => {
    const confirmed = window.confirm(`Delete ${notice.title}?`);
    if (!confirmed) return;

    const deleted = deleteNotice(notice.id);
    if (deleted) {
      toast.success(`${notice.title} deleted.`);
      return;
    }

    toast.error("Notice could not be deleted.");
  };

  const handleStatusChange = (notice, checked) => {
    const status = checked ? "active" : "inactive";
    const updatedNotice = updateNoticeStatus(notice.id, status);
    toast.success(`${updatedNotice.title} marked ${status}.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Mobile app notices
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Notice Board
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Create and manage notices that are sent to users inside the mobile
            app.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={openCreateModal}
        >
          <Plus size={16} />
          Create notice
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Total notices</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totals.total}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
              <BellRing size={21} />
            </div>
          </div>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm font-medium text-muted">Active</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {totals.active}
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm font-medium text-muted">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {totals.inactive}
          </p>
        </article>
      </section>

      <TableContainer>
        <div className="grid gap-3 border-b border-border px-5 py-4 lg:grid-cols-[minmax(18rem,1fr)_14rem_auto] lg:items-end">
          <label className="field-group">
            <span className="field-label">Search notices</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search title or description..."
                aria-label="Search notices"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={NOTICE_STATUS_OPTIONS}
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
        </div>

        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Notice list
            </h2>
            <p className="text-sm text-muted">
              {filteredNotices.length} of {notices.length} notices shown
            </p>
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Title</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredNotices.length > 0 ? (
                filteredNotices.map((notice, index) => (
                  <TableRow key={notice.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="min-w-72 max-w-2xl">
                        <p className="font-semibold text-foreground">
                          {notice.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                          {stripHtml(notice.description)}
                        </p>
                      </div>
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-36 items-center gap-3">
                        <StatusToggle
                          checked={notice.status === "active"}
                          label={`Set ${notice.title} active status`}
                          onChange={(checked) =>
                            handleStatusChange(notice, checked)
                          }
                        />
                        <StatusBadge status={notice.status} />
                      </div>
                    </TableTd>
                    <TableTd>
                      <NoticeActionMenu
                        notice={notice}
                        onDelete={handleDelete}
                        onEdit={openEditModal}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={4} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No notices found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the search or create a new notice.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <NoticeBoardModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        notice={modalState.notice}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
