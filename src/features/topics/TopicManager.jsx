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
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { Pagination } from "@/components/ui/Pagination";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useGetAllSubjectQuery } from "@/features/subjects/api/subjectsApi";
import { HierarchicalSubjectDropdown } from "@/features/subjects/HierarchicalSubjectDropdown";
import {
  useCreateTopicMutation,
  useDeleteTopicMutation,
  useGetAllTopicsQuery,
  useUpdateTopicMutation,
  useUpdateTopicStatusMutation,
} from "@/features/topics/api/topicsApi";
import {
  ALL_SUBJECTS_VALUE,
  buildSubjectOptions,
  getSubjectFilterOptions,
  getTopicsFromResponse,
  getTotalFromResponse,
} from "@/features/topics/topicUtils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  BookMarked,
  BookOpenText,
  Eye,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TopicModal } from "./TopicModal";

const ITEMS_PER_PAGE = 20;
const ALL_STATUSES_VALUE = "all";
const SUBJECT_OPTIONS_LIMIT = 1000;

const statusFilterOptions = [
  { label: "All statuses", value: ALL_STATUSES_VALUE },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

function TopicActionMenu({ onDelete, onEdit, topic }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${topic.name}`}
      menuHeight={136}
    >
      {({ closeMenu }) => (
        <>
          <Link
            href={`/topics/${topic.id}/view`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Eye size={15} className="text-muted" />
            View
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(topic);
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
              onDelete(topic);
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

function DeleteTopicDialog({ isDeleting, onClose, onConfirm, topic }) {
  if (!topic) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-topic-title"
    >
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close delete confirmation"
        onClick={onClose}
        disabled={isDeleting}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-rose-100 bg-surface shadow-2xl">
        <div className="flex items-start gap-4 border-b border-border bg-rose-50 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-danger shadow-sm">
            <ShieldAlert size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-topic-title"
              className="text-lg font-bold text-foreground"
            >
              Delete topic?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{topic.name}</span>
              . This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="icon-button h-9 w-9"
            aria-label="Close delete confirmation"
            onClick={onClose}
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete topic"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopicManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(ALL_SUBJECTS_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES_VALUE);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    topic: null,
  });
  const [deleteTopicState, setDeleteTopicState] = useState(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 450);

  const queryArgs = useMemo(
    () => ({
      search: debouncedSearchQuery.trim() || undefined,
      subjectID:
        subjectFilter === ALL_SUBJECTS_VALUE ? undefined : subjectFilter,
      status: statusFilter === ALL_STATUSES_VALUE ? undefined : statusFilter,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    [currentPage, debouncedSearchQuery, statusFilter, subjectFilter],
  );

  const { data, error, isFetching, isLoading, refetch } =
    useGetAllTopicsQuery(queryArgs);
  const { data: subjectsData, isFetching: isFetchingSubjects } =
    useGetAllSubjectQuery({
      page: 1,
      limit: SUBJECT_OPTIONS_LIMIT,
    });

  const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();
  const [updateTopic, { isLoading: isUpdating }] = useUpdateTopicMutation();
  const [updateTopicStatus] = useUpdateTopicStatusMutation();
  const [deleteTopic, { isLoading: isDeleting }] = useDeleteTopicMutation();

  const topics = getTopicsFromResponse(data);
  const totalItems = getTotalFromResponse(data, topics.length);
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const activeTopics = topics.filter((topic) => topic.status === true).length;
  const isBusy = isCreating || isUpdating || isDeleting;

  const subjectOptions = useMemo(
    () => buildSubjectOptions(subjectsData?.subjects || []),
    [subjectsData],
  );

  const subjectFilterOptions = useMemo(
    () => getSubjectFilterOptions(subjectOptions),
    [subjectOptions],
  );

  const handleSearchChange = (nextSearchQuery) => {
    setSearchQuery(nextSearchQuery);
    setCurrentPage(1);
  };

  const handleSubjectFilterChange = (option) => {
    setSubjectFilter(option.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (option) => {
    setStatusFilter(option.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSubjectFilter(ALL_SUBJECTS_VALUE);
    setStatusFilter(ALL_STATUSES_VALUE);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", topic: null });
  };

  const openEditModal = (topic) => {
    setModalState({ isOpen: true, mode: "edit", topic });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleTopicSubmit = async (topicInput) => {
    try {
      if (modalState.mode === "edit" && modalState.topic) {
        const updatedTopic = await updateTopic({
          id: modalState.topic.id,
          subjectID: topicInput.subjectID,
          name: topicInput.name,
        }).unwrap();
        toast.success(`${updatedTopic?.topic?.name || topicInput.name} updated.`);
        closeModal();
        return;
      }

      const createdTopic = await createTopic({
        subjectID: topicInput.subjectID,
        name: topicInput.name,
        status: topicInput.status,
      }).unwrap();
      toast.success(`${createdTopic?.topic?.name || topicInput.name} created.`);
      closeModal();
      resetFilters();
    } catch {
      toast.error(
        modalState.mode === "edit"
          ? "Topic could not be updated."
          : "Topic could not be created.",
      );
    }
  };

  const openDeleteDialog = (topic) => {
    setDeleteTopicState(topic);
  };

  const closeDeleteDialog = () => {
    setDeleteTopicState(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTopicState) return;

    try {
      await deleteTopic(deleteTopicState.id).unwrap();
      toast.success(`${deleteTopicState.name} deleted.`);
      if (topics.length === 1 && currentPage > 1) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
      closeDeleteDialog();
    } catch {
      toast.error("Topic could not be deleted.");
    }
  };

  const handleStatusChange = async (topic, checked) => {
    try {
      await updateTopicStatus({ id: topic.id, status: checked }).unwrap();
      toast.success(`${topic.name} marked ${checked ? "active" : "inactive"}.`);
    } catch {
      toast.error("Topic status could not be updated.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Topic management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Topics
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Manage topic records by subject, search the current list, and update
            active status directly from the table.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Loaded</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {topics.length}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {activeTopics}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Total</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totalItems}
            </p>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  Topic list
                </h2>
                <p className="text-sm text-muted">
                  {isFetching ? "Refreshing topics..." : `${totalItems} topics found`}
                </p>
              </div>

              <button
                type="button"
                className="button button-primary min-h-10"
                onClick={openCreateModal}
                disabled={subjectOptions.length === 0 || isFetchingSubjects}
              >
                <Plus size={16} />
                Create topic
              </button>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_minmax(14rem,18rem)_12rem_auto] xl:items-end">
              <CustomSearch
                placeholder="Search by topic name..."
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
                ariaLabel="Search topics"
                wide
              />
              <HierarchicalSubjectDropdown
                label="Subject"
                icon={BookOpenText}
                options={subjectFilterOptions}
                value={subjectFilter}
                onChange={handleSubjectFilterChange}
                placeholder="All subjects"
                searchPlaceholder="Search subjects..."
                emptyText="No subjects found."
              />
              <CustomDropdown
                label="Status"
                options={statusFilterOptions}
                value={statusFilter}
                onChange={handleStatusFilterChange}
                placeholder="All statuses"
              />
              <button
                type="button"
                className="button button-secondary min-h-10"
                onClick={resetFilters}
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-b border-border bg-rose-50 px-5 py-3 text-sm font-semibold text-danger">
            Topics could not be loaded.
            <button
              type="button"
              className="ml-2 underline underline-offset-2"
              onClick={refetch}
            >
              Retry
            </button>
          </div>
        )}

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Name</TableTh>
                <TableTh>Subject</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Actions</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableTd colSpan={5} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      Loading topics...
                    </p>
                  </TableTd>
                </TableRow>
              ) : topics.length > 0 ? (
                topics.map((topic, index) => (
                  <TableRow key={topic.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(
                        (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-56 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <BookMarked size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {topic.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted">
                            ID: {topic.id}
                          </p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="min-w-44 text-sm font-semibold text-foreground">
                      {topic.subject?.name || "Unknown subject"}
                    </TableTd>
                    <TableTd>
                      <div className="flex min-w-28 items-center gap-3">
                        <StatusToggle
                          checked={topic.status === true}
                          label={`Set ${topic.name} active status`}
                          onChange={(checked) =>
                            handleStatusChange(topic, checked)
                          }
                        />
                        <span className="text-xs font-semibold text-muted">
                          {topic.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <TopicActionMenu
                        topic={topic}
                        onDelete={openDeleteDialog}
                        onEdit={openEditModal}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={5} className="py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <FileText size={20} />
                    </div>
                    <p className="mt-3 font-semibold text-foreground">
                      No topics found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a topic.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>

        <Pagination
          currentPage={Math.min(currentPage, totalPages)}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </TableContainer>

      <TopicModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={closeModal}
        onSubmit={handleTopicSubmit}
        subjectOptions={subjectOptions}
        topic={modalState.topic}
        isSubmitting={isBusy}
      />
      <DeleteTopicDialog
        isDeleting={isDeleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        topic={deleteTopicState}
      />
    </div>
  );
}
