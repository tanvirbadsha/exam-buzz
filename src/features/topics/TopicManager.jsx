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
import { Pagination } from "@/components/ui/Pagination";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import {
  BookMarked,
  Eye,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TopicModal } from "./TopicModal";

const ITEMS_PER_PAGE = 6;

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildSubjectOptions(childrenMap) {
  const options = [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((subject) => {
      const path = [...parentPath, subject.name];
      options.push({
        label: subject.name,
        value: subject.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(subject.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

function formatDate(value) {
  if (!value) return "Not updated";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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

export function TopicManager({ initialSubjects, initialTopics }) {
  const {
    createTopics,
    deleteTopic,
    subjectIndex,
    topics,
    updateTopic,
    updateTopicStatus,
  } = useSubjectManagement(initialSubjects, initialTopics);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    topic: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const subjectOptions = useMemo(
    () => buildSubjectOptions(subjectIndex.childrenMap),
    [subjectIndex.childrenMap],
  );

  const enrichedTopics = useMemo(
    () =>
      topics.map((topic) => ({
        ...topic,
        subject: subjectIndex.subjectsById.get(topic.subjectId) || null,
      })),
    [subjectIndex.subjectsById, topics],
  );

  const filteredTopics = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) return enrichedTopics;

    return enrichedTopics.filter((topic) =>
      [
        topic.id,
        topic.name,
        topic.subject?.name,
        topic.status === "active" ? "active true" : "inactive false",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearchQuery, enrichedTopics]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTopics.length / ITEMS_PER_PAGE),
  );
  const activePage = Math.min(currentPage, totalPages);

  const paginatedTopics = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredTopics.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activePage, filteredTopics]);

  const activeTopics = useMemo(
    () => topics.filter((topic) => topic.status === "active").length,
    [topics],
  );

  const handleSearchChange = (nextSearchQuery) => {
    setSearchQuery(nextSearchQuery);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
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

  const handleTopicSubmit = (topicInput) => {
    if (modalState.mode === "edit" && modalState.topic) {
      const updatedTopic = updateTopic(modalState.topic.id, topicInput);
      if (updatedTopic) {
        toast.success(`${updatedTopic.name} updated.`);
      }
      return;
    }

    const createdTopics = createTopics(topicInput.subjectID, [topicInput]);
    if (createdTopics[0]) {
      toast.success(`${createdTopics[0].name} created.`);
    }
    resetFilters();
  };

  const handleDelete = (topic) => {
    const confirmed = window.confirm(`Delete ${topic.name}?`);
    if (!confirmed) return;

    const deletedTopic = deleteTopic(topic.id);
    if (deletedTopic) {
      toast.success(`${deletedTopic.name} deleted.`);
      setCurrentPage(1);
      return;
    }

    toast.error("Topic could not be deleted.");
  };

  const handleStatusChange = (topic, checked) => {
    const status = checked ? "active" : "inactive";
    const updatedTopic = updateTopicStatus(topic.id, status);
    if (updatedTopic) {
      toast.success(`${updatedTopic.name} marked ${status}.`);
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
            <p className="text-xs font-semibold text-muted">Total</p>
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
            <p className="text-xs font-semibold text-muted">Visible</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {filteredTopics.length}
            </p>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Topic list
              </h2>
              <p className="text-sm text-muted">
                {filteredTopics.length} of {topics.length} topics shown
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_auto_auto] lg:min-w-[42rem]">
              <CustomSearch
                placeholder="Search by topic, subject, or status..."
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
                ariaLabel="Search topics"
                wide
              />
              <button
                type="button"
                className="button button-secondary min-h-10"
                onClick={resetFilters}
              >
                <RotateCcw size={15} />
                Reset
              </button>
              <button
                type="button"
                className="button button-primary min-h-10"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                Create topic
              </button>
            </div>
          </div>
        </div>

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
              {paginatedTopics.length > 0 ? (
                paginatedTopics.map((topic, index) => (
                  <TableRow key={topic.id}>
                    <TableTd className="font-mono text-xs text-muted">
                      {String(
                        (activePage - 1) * ITEMS_PER_PAGE + index + 1,
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
                          checked={topic.status === "active"}
                          label={`Set ${topic.name} active status`}
                          onChange={(checked) =>
                            handleStatusChange(topic, checked)
                          }
                        />
                        <span className="text-xs font-semibold text-muted">
                          {topic.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableTd>
                    <TableTd>
                      <TopicActionMenu
                        topic={topic}
                        onDelete={handleDelete}
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
                      Adjust the search query or create a topic.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>

        <Pagination
          currentPage={activePage}
          totalItems={filteredTopics.length}
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
      />
    </div>
  );
}
