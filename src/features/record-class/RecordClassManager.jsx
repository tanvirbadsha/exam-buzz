"use client";

import {
  CalendarClock,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import Image from "next/image";
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
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { useRecordClassManagement } from "@/hooks/useRecordClassManagement";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import {
  ALL_RECORD_CLASS_CATEGORY_VALUE,
  NO_EXAM_VALUE,
  RECORD_CLASS_EXAM_FILTER_OPTIONS,
  formatRecordClassPublishAt,
  getRecordClassExamLabel,
  getYoutubeVideoId,
} from "@/lib/recordClassData";
import { RecordClassModal } from "./RecordClassModal";

function sortCategories(categories) {
  return [...categories].sort((firstCategory, secondCategory) =>
    firstCategory.name.localeCompare(secondCategory.name),
  );
}

function buildCategoryOptions(childrenMap, includeAllOption = false) {
  const options = includeAllOption
    ? [
        {
          label: "All categories",
          value: ALL_RECORD_CLASS_CATEGORY_VALUE,
          depth: 0,
          meta: "All categories",
          searchText: "all categories",
        },
      ]
    : [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortCategories(childrenMap.get(parentId) || []);

    children.forEach((category) => {
      const path = [...parentPath, category.name];
      options.push({
        label: category.name,
        value: category.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(category.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

function getDescendantIds(childrenMap, categoryId) {
  const descendantIds = new Set();
  const stack = [...(childrenMap.get(categoryId) || [])];

  while (stack.length > 0) {
    const category = stack.pop();
    if (!category || descendantIds.has(category.id)) continue;

    descendantIds.add(category.id);
    stack.push(...(childrenMap.get(category.id) || []));
  }

  return descendantIds;
}

function getCategoryPath(categoriesById, categoryId) {
  const path = [];
  const visitedIds = new Set();
  let category = categoriesById.get(categoryId);

  while (category && !visitedIds.has(category.id)) {
    path.unshift(category);
    visitedIds.add(category.id);
    category = category.parentId ? categoriesById.get(category.parentId) : null;
  }

  return path;
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

function RecordClassActionMenu({ recordClass, onDelete, onEdit }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${recordClass.title}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(recordClass);
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
              onDelete(recordClass);
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

function VideoThumb({ youtubeUrl, title }) {
  const videoId = getYoutubeVideoId(youtubeUrl);

  if (!videoId) {
    return (
      <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-border bg-surface-muted text-muted">
        <Video size={20} />
      </div>
    );
  }

  return (
    <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-border bg-surface-muted">
      <Image
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt=""
        width={160}
        height={90}
        unoptimized
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-strong shadow-sm">
          <Video size={15} />
        </span>
      </span>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function RecordClassManager({
  initialCategories,
  initialRecordClasses,
  initialSubjects,
  initialTopics,
}) {
  const { categoryIndex } = useCategoryManagement(initialCategories);
  const { subjectIndex, topics, topicsBySubjectId } = useSubjectManagement(
    initialSubjects,
    initialTopics,
  );
  const {
    createRecordClass,
    deleteRecordClass,
    recordClasses,
    totals,
    updateRecordClass,
  } = useRecordClassManagement(initialRecordClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    ALL_RECORD_CLASS_CATEGORY_VALUE,
  );
  const [examFilter, setExamFilter] = useState("all");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    recordClass: null,
  });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categoryIndex.childrenMap),
    [categoryIndex.childrenMap],
  );

  const categoryFilterOptions = useMemo(
    () => buildCategoryOptions(categoryIndex.childrenMap, true),
    [categoryIndex.childrenMap],
  );
  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const filteredRecordClasses = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const categoryIds =
      categoryFilter === ALL_RECORD_CLASS_CATEGORY_VALUE
        ? null
        : getDescendantIds(categoryIndex.childrenMap, categoryFilter);

    if (categoryIds) {
      categoryIds.add(categoryFilter);
    }

    return recordClasses.filter((recordClass) => {
      const matchesSearch =
        !query ||
        [recordClass.id, recordClass.title]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory =
        !categoryIds || categoryIds.has(recordClass.categoryId);
      const matchesExam =
        examFilter === "all" ||
        (examFilter === NO_EXAM_VALUE
          ? !recordClass.examId
          : recordClass.examId === examFilter);

      return matchesSearch && matchesCategory && matchesExam;
    });
  }, [
    categoryFilter,
    categoryIndex.childrenMap,
    deferredSearchQuery,
    examFilter,
    recordClasses,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter(ALL_RECORD_CLASS_CATEGORY_VALUE);
    setExamFilter("all");
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", recordClass: null });
  };

  const openEditModal = (recordClass) => {
    setModalState({ isOpen: true, mode: "edit", recordClass });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleSubmit = (recordClassInput) => {
    if (modalState.mode === "edit" && modalState.recordClass) {
      const updatedRecordClass = updateRecordClass(
        modalState.recordClass.id,
        recordClassInput,
      );

      if (updatedRecordClass) {
        toast.success(`${updatedRecordClass.title} updated.`);
      }
      return;
    }

    const createdRecordClass = createRecordClass(recordClassInput);
    toast.success(`${createdRecordClass.title} added.`);
  };

  const handleDelete = (recordClass) => {
    const confirmed = window.confirm(`Delete ${recordClass.title}?`);
    if (!confirmed) return;

    const deleted = deleteRecordClass(recordClass.id);
    if (deleted) {
      toast.success(`${recordClass.title} deleted.`);
      return;
    }

    toast.error("Recorded class could not be deleted.");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Video learning
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Record Class
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Add YouTube recorded classes, map them to category syllabuses, and
            keep exam-specific videos easy to find.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Videos</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Exam linked</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.linkedToExam}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">No exam</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.withoutExam}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_18rem_14rem_auto_auto] xl:items-end">
          <label className="field-group">
            <span className="field-label">Search videos</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search by ID or name..."
                aria-label="Search recorded classes"
              />
            </span>
          </label>

          <HierarchicalCategoryDropdown
            label="Category"
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={(option) => setCategoryFilter(option.value)}
            placeholder="All categories"
            searchPlaceholder="Search categories..."
          />

          <CustomDropdown
            label="Exam"
            options={RECORD_CLASS_EXAM_FILTER_OPTIONS}
            value={examFilter}
            onChange={(option) => setExamFilter(option.value)}
            placeholder="All exams"
            searchPlaceholder="Search exams..."
          />

          <button
            type="button"
            className="button button-secondary min-h-11"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            type="button"
            className="button button-primary min-h-11"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Add class
          </button>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Recorded video list
            </h2>
            <p className="text-sm text-muted">
              {filteredRecordClasses.length} of {recordClasses.length} videos
              shown
            </p>
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Video</TableTh>
                <TableTh>Category</TableTh>
                <TableTh>Subject / folder</TableTh>
                <TableTh>Exam</TableTh>
                <TableTh>Publish date</TableTh>
                <TableTh>Link</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredRecordClasses.length > 0 ? (
                filteredRecordClasses.map((recordClass) => {
                  const categoryPath = getCategoryPath(
                    categoryIndex.categoriesById,
                    recordClass.categoryId,
                  );
                  const categoryLabel =
                    categoryPath.map((category) => category.name).join(" / ") ||
                    "Unknown category";
                  const subjectPath = getSubjectPath(
                    subjectIndex.subjectsById,
                    recordClass.subjectId,
                  );
                  const subjectLabel =
                    subjectPath.map((subject) => subject.name).join(" / ") ||
                    "Unknown subject";
                  const materialFolder = recordClass.materialFolderId
                    ? topicsById.get(recordClass.materialFolderId)
                    : null;

                  return (
                    <TableRow key={recordClass.id}>
                      <TableTd>
                        <div className="flex min-w-96 items-center gap-3">
                          <VideoThumb
                            youtubeUrl={recordClass.youtubeUrl}
                            title={recordClass.title}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {recordClass.title}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted">
                              {recordClass.id}
                            </p>
                          </div>
                        </div>
                      </TableTd>
                      <TableTd>
                        <span className="inline-flex min-w-44 max-w-72 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-strong">
                          <span className="truncate">{categoryLabel}</span>
                        </span>
                      </TableTd>
                      <TableTd>
                        <div className="min-w-52">
                          <p className="text-sm font-semibold text-foreground">
                            {subjectLabel}
                          </p>
                          <p className="mt-1 text-xs font-medium text-muted">
                            {materialFolder?.name || "No material folder"}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="min-w-48 font-semibold text-foreground">
                        {getRecordClassExamLabel(recordClass.examId)}
                      </TableTd>
                      <TableTd className="min-w-44">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <CalendarClock size={15} className="text-muted" />
                          {formatRecordClassPublishAt(recordClass.publishAt)}
                        </div>
                      </TableTd>
                      <TableTd>
                        <a
                          href={recordClass.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-button h-9 w-9 border border-border"
                          aria-label={`Open ${recordClass.title} on YouTube`}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </TableTd>
                      <TableTd>
                        <RecordClassActionMenu
                          recordClass={recordClass}
                          onDelete={handleDelete}
                          onEdit={openEditModal}
                        />
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No recorded classes found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or add a new recorded class.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <RecordClassModal
        categoryIndex={categoryIndex}
        categoryOptions={categoryOptions}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        recordClass={modalState.recordClass}
        subjectIndex={subjectIndex}
        topicsBySubjectId={topicsBySubjectId}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
