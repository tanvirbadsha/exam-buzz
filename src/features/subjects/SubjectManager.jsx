"use client";

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
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import { SUBJECT_STATUS_OPTIONS } from "@/lib/subjectData";
import {
  ArrowLeft,
  BookMarked,
  ChevronRight,
  Eye,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ROOT_SUBJECT_VALUE } from "./SubjectForm";
import { SubjectDetailModal } from "./SubjectDetailModal";
import { isUploadedSubjectIcon, SubjectIcon } from "./SubjectIcon";
import { SubjectModal } from "./SubjectModal";
import { TopicModal } from "./TopicModal";

function SubjectActionMenu({
  onAddTopics,
  onDelete,
  onEdit,
  onView,
  subject,
}) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${subject.name}`}
      menuHeight={184}
    >
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onView(subject);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Eye size={15} className="text-muted" />
            View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onAddTopics(subject);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Plus size={15} className="text-muted" />
            Add topics
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(subject);
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
              onDelete(subject);
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

function TopicActionMenu({ onDelete, onEdit, topic }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${topic.name}`}
      menuHeight={96}
    >
      {({ closeMenu }) => (
        <>
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

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildParentOptions(childrenMap, excludedIds = new Set()) {
  const options = [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((subject) => {
      if (excludedIds.has(subject.id)) return;

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

function getSubjectPath(subjectsById, subjectId) {
  const path = [];
  const visitedIds = new Set();
  let subject = subjectsById.get(subjectId);

  while (subject && !visitedIds.has(subject.id)) {
    path.unshift(subject);
    visitedIds.add(subject.id);
    subject = subject.parentId ? subjectsById.get(subject.parentId) : null;
  }

  return path;
}

export function SubjectManager({ initialSubjects, initialTopics }) {
  const {
    createSubject,
    createTopics,
    deleteSubject,
    deleteTopic,
    subjectIndex,
    topicsBySubjectId,
    totals,
    updateSubject,
    updateSubjectStatus,
    updateTopic,
    updateTopicStatus,
  } = useSubjectManagement(initialSubjects, initialTopics);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedTopicSubjectId, setSelectedTopicSubjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectModalState, setSubjectModalState] = useState({
    isOpen: false,
    mode: "create",
    subject: null,
  });
  const [topicModalState, setTopicModalState] = useState({
    isOpen: false,
    mode: "create",
    subject: null,
    topic: null,
  });
  const [viewSubject, setViewSubject] = useState(null);
  const topicsTableRef = useRef(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const selectedSubject =
    selectedParentId && subjectIndex.subjectsById.has(selectedParentId)
      ? subjectIndex.subjectsById.get(selectedParentId)
      : null;
  const selectedTopicSubject =
    selectedTopicSubjectId && subjectIndex.subjectsById.has(selectedTopicSubjectId)
      ? subjectIndex.subjectsById.get(selectedTopicSubjectId)
      : selectedSubject;
  const currentParentKey = selectedSubject?.id || "root";
  const currentSubjects = useMemo(
    () => sortByName(subjectIndex.childrenMap.get(currentParentKey) || []),
    [currentParentKey, subjectIndex.childrenMap],
  );
  const breadcrumbSubjects = useMemo(
    () =>
      selectedSubject
        ? getSubjectPath(subjectIndex.subjectsById, selectedSubject.id)
        : [],
    [selectedSubject, subjectIndex.subjectsById],
  );
  const selectedSubjectTopics = useMemo(
    () =>
      selectedTopicSubject
        ? sortByName(topicsBySubjectId.get(selectedTopicSubject.id) || [])
        : [],
    [selectedTopicSubject, topicsBySubjectId],
  );

  const filteredSubjects = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return currentSubjects.filter((subject) => {
      const searchableIcon = isUploadedSubjectIcon(subject.icon)
        ? ""
        : subject.icon;
      const matchesSearch =
        !query ||
        [subject.name, searchableIcon].join(" ").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || subject.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [currentSubjects, deferredSearchQuery, statusFilter]);

  const parentOptions = useMemo(() => {
    const excludedIds = new Set();

    if (subjectModalState.mode === "edit" && subjectModalState.subject) {
      excludedIds.add(subjectModalState.subject.id);
      subjectIndex.descendantCounts.forEach((_, subjectId) => {
        const path = getSubjectPath(subjectIndex.subjectsById, subjectId);
        const isDescendant = path.some(
          (pathSubject) => pathSubject.id === subjectModalState.subject.id,
        );

        if (isDescendant && subjectId !== subjectModalState.subject.id) {
          excludedIds.add(subjectId);
        }
      });
    }

    return buildParentOptions(subjectIndex.childrenMap, excludedIds);
  }, [
    subjectIndex.childrenMap,
    subjectIndex.descendantCounts,
    subjectIndex.subjectsById,
    subjectModalState.mode,
    subjectModalState.subject,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const openCreateSubjectModal = () => {
    setSubjectModalState({ isOpen: true, mode: "create", subject: null });
  };

  const openEditSubjectModal = (subject) => {
    setSubjectModalState({ isOpen: true, mode: "edit", subject });
  };

  const closeSubjectModal = () => {
    setSubjectModalState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));
  };

  const openCreateTopicModal = (subject) => {
    setTopicModalState({ isOpen: true, mode: "create", subject, topic: null });
  };

  const openEditTopicModal = (topic) => {
    setTopicModalState({
      isOpen: true,
      mode: "edit",
      subject: selectedTopicSubject,
      topic,
    });
  };

  const closeTopicModal = () => {
    setTopicModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const drillIntoSubject = (subject) => {
    setSelectedParentId(subject.id);
    setSelectedTopicSubjectId(subject.id);
    resetFilters();
  };

  const showSubjectTopics = (subject) => {
    setSelectedTopicSubjectId(subject.id);
    requestAnimationFrame(() => {
      topicsTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleSubjectSubmit = (subjectInput) => {
    if (subjectModalState.mode === "edit" && subjectModalState.subject) {
      const updatedSubject = updateSubject(
        subjectModalState.subject.id,
        subjectInput,
      );
      if (updatedSubject) {
        toast.success(`${updatedSubject.name} updated.`);
      }
      return;
    }

    const createdSubject = createSubject(subjectInput);
    toast.success(`${createdSubject.name} created.`);
  };

  const handleSubjectDelete = (subject) => {
    const descendantCount = subjectIndex.descendantCounts.get(subject.id) || 0;
    const topicCount = subjectIndex.topicCounts.get(subject.id) || 0;
    const confirmed = window.confirm(
      descendantCount > 0 || topicCount > 0
        ? `Delete ${subject.name}, ${descendantCount} nested subject${descendantCount === 1 ? "" : "s"}, and related topics?`
        : `Delete ${subject.name}?`,
    );
    if (!confirmed) return;

    const result = deleteSubject(subject.id);
    if (!result) {
      toast.error("Subject could not be deleted.");
      return;
    }

    toast.success(
      result.deletedCount > 1
        ? `${result.deletedCount} subjects deleted.`
        : `${subject.name} deleted.`,
    );
    resetFilters();
  };

  const handleSubjectStatusChange = (subject, checked) => {
    const status = checked ? "active" : "inactive";
    const updatedSubject = updateSubjectStatus(subject.id, status);
    if (updatedSubject) {
      toast.success(`${updatedSubject.name} marked ${status}.`);
    }
  };

  const handleTopicSubmit = (topicRows) => {
    if (!topicModalState.subject) return;

    if (topicModalState.mode === "edit" && topicModalState.topic) {
      const updatedTopic = updateTopic(topicModalState.topic.id, topicRows[0]);
      if (updatedTopic) {
        toast.success(`${updatedTopic.name} updated.`);
      }
      return;
    }

    const createdTopics = createTopics(topicModalState.subject.id, topicRows);
    toast.success(
      createdTopics.length === 1
        ? `${createdTopics[0].name} created.`
        : `${createdTopics.length} topics created.`,
    );
  };

  const handleTopicDelete = (topic) => {
    const confirmed = window.confirm(`Delete ${topic.name}?`);
    if (!confirmed) return;

    const deleted = deleteTopic(topic.id);
    if (deleted) {
      toast.success(`${deleted.name} deleted.`);
    }
  };

  const handleTopicStatusChange = (topic, checked) => {
    const status = checked ? "active" : "inactive";
    const updatedTopic = updateTopicStatus(topic.id, status);
    if (updatedTopic) {
      toast.success(`${updatedTopic.name} marked ${status}.`);
    }
  };

  const showParentColumn = Boolean(selectedSubject);
  const tableTitle = selectedSubject ? selectedSubject.name : "Subjects";
  const tableSummary = `${filteredSubjects.length} of ${currentSubjects.length} ${
    selectedSubject ? "direct sub-subjects" : "main subjects"
  } shown`;
  const emptyTableColSpan = showParentColumn ? 7 : 6;
  const viewedParent = viewSubject?.parentId
    ? subjectIndex.subjectsById.get(viewSubject.parentId)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam subjects
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Subject hierarchy
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Create subjects, nest sub-subjects under any parent, and add one or
            many topics to the selected subject level.
          </p>
        </div>

        <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Total</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Main</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.root}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Topics</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.topics}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.active}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_14rem_auto_auto_auto] lg:items-end">
          <label className="field-group">
            <span className="field-label">Search current level</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search name or icon..."
                aria-label="Search subjects"
              />
            </span>
          </label>

          <CustomDropdown
            label="Status"
            options={SUBJECT_STATUS_OPTIONS}
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
          {selectedSubject && (
            <button
              type="button"
              className="button button-secondary min-h-11"
              onClick={() => openCreateTopicModal(selectedTopicSubject)}
            >
              <Plus size={16} />
              Add topics
            </button>
          )}
          <button
            type="button"
            className="button button-primary min-h-11"
            onClick={openCreateSubjectModal}
          >
            <Plus size={16} />
            {selectedSubject ? "Create sub-subject" : "Create subject"}
          </button>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            {selectedSubject ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-brand-strong transition-colors hover:bg-brand-soft"
                  onClick={() => {
                    setSelectedParentId(null);
                    setSelectedTopicSubjectId(null);
                    resetFilters();
                  }}
                >
                  Subjects
                </button>
                {breadcrumbSubjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="inline-flex min-w-0 items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-border-strong" />
                    <button
                      type="button"
                      className={`max-w-44 truncate rounded-md px-2 py-1 transition-colors ${
                        subject.id === selectedSubject?.id
                          ? "bg-brand-soft text-brand-strong"
                          : "text-brand-strong hover:bg-brand-soft"
                      }`}
                      onClick={() => {
                        setSelectedParentId(subject.id);
                        setSelectedTopicSubjectId(subject.id);
                        resetFilters();
                      }}
                    >
                      {subject.name}
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <h2 className="text-base font-semibold text-foreground">
                {tableTitle}
              </h2>
            )}
            {selectedSubject && <h2 className="sr-only">{tableTitle}</h2>}
            <p className="text-sm text-muted">{tableSummary}</p>
          </div>

          {selectedSubject && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                const parentId = selectedSubject.parentId || null;
                setSelectedParentId(parentId);
                setSelectedTopicSubjectId(parentId);
                resetFilters();
              }}
            >
              <ArrowLeft size={16} />
              Back one level
            </button>
          )}
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Serial</TableTh>
                <TableTh>Subject</TableTh>
                {showParentColumn && <TableTh>Parent</TableTh>}
                <TableTh>Sub-subjects</TableTh>
                <TableTh>Topics</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => {
                  const directChildCount =
                    subjectIndex.directChildCounts.get(subject.id) || 0;
                  const topicCount =
                    subjectIndex.topicCounts.get(subject.id) || 0;
                  const parent =
                    showParentColumn && subject.parentId
                      ? subjectIndex.subjectsById.get(subject.parentId)
                      : null;

                  return (
                    <TableRow key={subject.id}>
                      <TableTd className="font-mono text-xs text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-72 items-start gap-3">
                          <SubjectIcon
                            icon={subject.icon}
                            name={subject.name}
                            className="mt-0.5 h-9 w-9 text-xs"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {subject.name}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted">
                              {subject.parentId
                                ? "Sub-subject"
                                : "Main subject"}
                            </p>
                          </div>
                        </div>
                      </TableTd>
                      {showParentColumn && (
                        <TableTd className="text-sm text-muted">
                          {parent ? parent.name : "Top-level"}
                        </TableTd>
                      )}
                      <TableTd>
                        {directChildCount > 0 ? (
                          <button
                            type="button"
                            className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-brand-soft bg-brand-soft px-3 text-sm font-black text-brand-strong transition-colors hover:border-brand hover:bg-white"
                            onClick={() => drillIntoSubject(subject)}
                            aria-label={`Show ${directChildCount} sub-subjects of ${subject.name}`}
                          >
                            {directChildCount}
                          </button>
                        ) : (
                          <span className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-sm font-bold text-muted">
                            0
                          </span>
                        )}
                      </TableTd>
                      <TableTd>
                        {topicCount > 0 ? (
                          <button
                            type="button"
                            className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-sm font-black text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-white"
                            onClick={() => showSubjectTopics(subject)}
                            aria-label={`Show ${topicCount} topics of ${subject.name}`}
                          >
                            {topicCount}
                          </button>
                        ) : (
                          <span className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-sm font-bold text-muted">
                            0
                          </span>
                        )}
                      </TableTd>
                      <TableTd>
                        <StatusToggle
                          checked={subject.status === "active"}
                          label={`Set ${subject.name} active status`}
                          onChange={(checked) =>
                            handleSubjectStatusChange(subject, checked)
                          }
                        />
                      </TableTd>
                      <TableTd>
                        <SubjectActionMenu
                          subject={subject}
                          onAddTopics={openCreateTopicModal}
                          onDelete={handleSubjectDelete}
                          onEdit={openEditSubjectModal}
                          onView={setViewSubject}
                        />
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd
                    colSpan={emptyTableColSpan}
                    className="py-12 text-center"
                  >
                    <p className="font-semibold text-foreground">
                      No subjects found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a subject at this level.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      {selectedTopicSubject && (
        <div ref={topicsTableRef} className="scroll-mt-6">
          <TableContainer>
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <BookMarked size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  Topics in {selectedTopicSubject.name}
                </h2>
                <p className="text-sm text-muted">
                  {selectedSubjectTopics.length} topic
                  {selectedSubjectTopics.length === 1 ? "" : "s"} shown
                </p>
              </div>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => openCreateTopicModal(selectedTopicSubject)}
            >
              <Plus size={16} />
              Add topics
            </button>
          </div>

          <TableResponsive>
            <Table>
              <TableHead>
                <tr>
                  <TableTh>Serial</TableTh>
                  <TableTh>Topic</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh className="text-right">Action</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {selectedSubjectTopics.length > 0 ? (
                  selectedSubjectTopics.map((topic, index) => (
                    <TableRow key={topic.id}>
                      <TableTd className="font-mono text-xs text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-72 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                            <Layers size={16} />
                          </span>
                          <p className="font-semibold text-foreground">
                            {topic.name}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd>
                        <StatusToggle
                          checked={topic.status === "active"}
                          label={`Set ${topic.name} active status`}
                          onChange={(checked) =>
                            handleTopicStatusChange(topic, checked)
                          }
                        />
                      </TableTd>
                      <TableTd>
                        <TopicActionMenu
                          topic={topic}
                          onDelete={handleTopicDelete}
                          onEdit={openEditTopicModal}
                        />
                      </TableTd>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableTd colSpan={4} className="py-10 text-center">
                      <p className="font-semibold text-foreground">
                        No topics found
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Add topics for this subject when you are ready.
                      </p>
                    </TableTd>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableResponsive>
          </TableContainer>
        </div>
      )}

      <SubjectModal
        defaultParentId={selectedSubject?.id || ROOT_SUBJECT_VALUE}
        isOpen={subjectModalState.isOpen}
        mode={subjectModalState.mode}
        parentOptions={parentOptions}
        subject={subjectModalState.subject}
        onClose={closeSubjectModal}
        onSubmit={handleSubjectSubmit}
      />

      <TopicModal
        isOpen={topicModalState.isOpen}
        mode={topicModalState.mode}
        subject={topicModalState.subject}
        topic={topicModalState.topic}
        onClose={closeTopicModal}
        onSubmit={handleTopicSubmit}
      />

      <SubjectDetailModal
        childCount={
          viewSubject
            ? subjectIndex.directChildCounts.get(viewSubject.id) || 0
            : 0
        }
        isOpen={Boolean(viewSubject)}
        parent={viewedParent}
        subject={viewSubject}
        topicCount={
          viewSubject ? subjectIndex.topicCounts.get(viewSubject.id) || 0 : 0
        }
        onClose={() => setViewSubject(null)}
      />
    </div>
  );
}
