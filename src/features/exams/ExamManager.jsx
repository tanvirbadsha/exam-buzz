"use client";

import {
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { useExamManagement } from "@/hooks/useExamManagement";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import {
  ALL_EXAM_CATEGORY_VALUE,
  ALL_EXAM_SUBJECT_VALUE,
  formatExamTimeline,
  getExamCategoryId,
  getExamPdfLabel,
} from "@/lib/examData";

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildTreeOptions(childrenMap, includeAllOption, allOption) {
  const options = includeAllOption ? [allOption] : [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((item) => {
      const path = [...parentPath, item.name];
      options.push({
        label: item.name,
        value: item.id,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(item.id, depth + 1, path);
    });
  };

  walk();
  return options;
}

function getDescendantIds(childrenMap, itemId) {
  const descendantIds = new Set();
  const stack = [...(childrenMap.get(itemId) || [])];

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item || descendantIds.has(item.id)) continue;

    descendantIds.add(item.id);
    stack.push(...(childrenMap.get(item.id) || []));
  }

  return descendantIds;
}

function getPath(itemsById, itemId) {
  const path = [];
  const visitedIds = new Set();
  let item = itemsById.get(itemId);

  while (item && !visitedIds.has(item.id)) {
    path.unshift(item);
    visitedIds.add(item.id);
    item = item.parentId ? itemsById.get(item.parentId) : null;
  }

  return path;
}

function getNamesByIds(ids, itemsById, fallbackPrefix) {
  return ids.map((id) => itemsById.get(id)?.name || `${fallbackPrefix} ${id}`);
}

function PdfLink({ href, label }) {
  if (!href) {
    return <span className="text-xs font-semibold text-muted">Not uploaded</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-start gap-1.5 break-all text-xs font-bold text-brand-strong hover:underline"
    >
      <Download size={14} className="mt-0.5 shrink-0" />
      {label}
    </a>
  );
}

function ExamActionMenu({ exam, onDelete }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${exam.name}`}>
      {({ closeMenu }) => (
        <>
          <Link
            href={`/exams/${exam.id}/view`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Eye size={15} className="text-muted" />
            View
          </Link>
          <Link
            href={`/exams/${exam.id}/edit`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            onClick={closeMenu}
          >
            <Pencil size={15} className="text-muted" />
            Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(exam);
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

export function ExamManager({
  initialCategories,
  initialExams,
  initialSubjects,
  initialTopics,
}) {
  const { categoryIndex } = useCategoryManagement(initialCategories);
  const { subjectIndex, topics } = useSubjectManagement(
    initialSubjects,
    initialTopics,
  );
  const { deleteExam, exams, totals, updateExamStatus } =
    useExamManagement(initialExams);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_EXAM_CATEGORY_VALUE);
  const [subjectFilter, setSubjectFilter] = useState(ALL_EXAM_SUBJECT_VALUE);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categoryFilterOptions = useMemo(
    () =>
      buildTreeOptions(categoryIndex.childrenMap, true, {
        label: "All categories",
        value: ALL_EXAM_CATEGORY_VALUE,
        depth: 0,
        meta: "All categories",
        searchText: "all categories",
      }),
    [categoryIndex.childrenMap],
  );
  const subjectFilterOptions = useMemo(
    () =>
      buildTreeOptions(subjectIndex.childrenMap, true, {
        label: "All subjects",
        value: ALL_EXAM_SUBJECT_VALUE,
        depth: 0,
        meta: "All subjects",
        searchText: "all subjects",
      }),
    [subjectIndex.childrenMap],
  );
  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const filteredExams = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const categoryIds =
      categoryFilter === ALL_EXAM_CATEGORY_VALUE
        ? null
        : getDescendantIds(categoryIndex.childrenMap, categoryFilter);
    const subjectIds =
      subjectFilter === ALL_EXAM_SUBJECT_VALUE
        ? null
        : getDescendantIds(subjectIndex.childrenMap, subjectFilter);

    if (categoryIds) categoryIds.add(categoryFilter);
    if (subjectIds) subjectIds.add(subjectFilter);

    return exams.filter((exam) => {
      const examCategoryId = getExamCategoryId(exam);
      const examSubjectIds = (exam.subjectIds || []).map((subjectId) =>
        String(subjectId),
      );
      const examTopicIds = (exam.topicIds || []).map((topicId) =>
        String(topicId),
      );
      const subjectNames = getNamesByIds(
        examSubjectIds,
        subjectIndex.subjectsById,
        "Subject",
      );
      const topicNames = getNamesByIds(examTopicIds, topicsById, "Topic");
      const statusText = exam.status ? "active true" : "inactive false";
      const matchesSearch =
        !query ||
        [
          exam.id,
          exam.name,
          subjectNames.join(" "),
          topicNames.join(" "),
          exam.publishedDate,
          exam.expiredDate,
          statusText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory =
        !categoryIds || categoryIds.has(examCategoryId);
      const matchesSubject =
        !subjectIds ||
        examSubjectIds.some((subjectId) => subjectIds.has(subjectId));
      return matchesSearch && matchesCategory && matchesSubject;
    });
  }, [
    categoryFilter,
    categoryIndex.childrenMap,
    deferredSearchQuery,
    exams,
    subjectFilter,
    subjectIndex.childrenMap,
    subjectIndex.subjectsById,
    topicsById,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter(ALL_EXAM_CATEGORY_VALUE);
    setSubjectFilter(ALL_EXAM_SUBJECT_VALUE);
  };

  const handleDelete = (exam) => {
    const confirmed = window.confirm(`Delete ${exam.name}?`);
    if (!confirmed) return;

    const deleted = deleteExam(exam.id);
    if (deleted) {
      toast.success(`${exam.name} deleted.`);
      return;
    }

    toast.error("Exam could not be deleted.");
  };

  const handleStatusChange = (exam, checked) => {
    const updatedExam = updateExamStatus(exam.id, checked);
    if (updatedExam) {
      toast.success(`${updatedExam.name} marked ${checked ? "active" : "inactive"}.`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-2 xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam operations
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Exams
          </h1>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-5 py-5">
            <p className="text-xs font-semibold text-muted">Exams</p>
            <p className="mt-2 text-2xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="border-r border-border px-5 py-5">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-2 text-2xl font-black text-foreground">
              {totals.active}
            </p>
          </div>
          <div className="px-5 py-5">
            <p className="text-xs font-semibold text-muted">Inactive</p>
            <p className="mt-2 text-2xl font-black text-foreground">
              {totals.inactive}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_minmax(13rem,16rem)_minmax(13rem,16rem)_auto_auto] xl:items-end">
          <label className="field-group min-w-0">
            <span className="field-label">Search exams</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search by name, subject, topic..."
                aria-label="Search exams"
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

          <HierarchicalCategoryDropdown
            label="Subject"
            options={subjectFilterOptions}
            value={subjectFilter}
            onChange={(option) => setSubjectFilter(option.value)}
            placeholder="All subjects"
            searchPlaceholder="Search subjects..."
          />

          <button
            type="button"
            className="button button-secondary min-h-11 md:self-end"
            onClick={resetFilters}
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <Link
            href="/exams/create"
            className="button button-primary min-h-11 md:self-end"
          >
            <Plus size={16} />
            Create exam
          </Link>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Exam list
            </h2>
            <p className="text-sm text-muted">
              {filteredExams.length} of {exams.length} exams shown
            </p>
          </div>
        </div>

        <div className="overflow-hidden">
          <Table className="table-fixed text-xs">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[17%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
            </colgroup>
            <TableHead>
              <tr>
                <TableTh className="px-3">Name</TableTh>
                <TableTh className="px-3">Subjects<br />Name</TableTh>
                <TableTh className="px-3">Topic &<br />Source Name</TableTh>
                <TableTh className="px-3">Exam<br />Timeline</TableTh>
                <TableTh className="px-3">Duration<br />(min)</TableTh>
                <TableTh className="px-3">Question &<br />Answer</TableTh>
                <TableTh className="px-3">Status</TableTh>
                <TableTh className="px-2 text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const examSubjectIds = (exam.subjectIds || []).map((id) =>
                    String(id),
                  );
                  const examTopicIds = (exam.topicIds || []).map((id) =>
                    String(id),
                  );
                  const subjectNames = getNamesByIds(
                    examSubjectIds,
                    subjectIndex.subjectsById,
                    "Subject",
                  );
                  const topicNames = getNamesByIds(
                    examTopicIds,
                    topicsById,
                    "Topic",
                  );
                  const categoryPath = getPath(
                    categoryIndex.categoriesById,
                    getExamCategoryId(exam),
                  );
                  const sourceName =
                    categoryPath.map((category) => category.name).join(" / ") ||
                    exam.category?.name ||
                    "Unknown source";
                  const timeline = formatExamTimeline(exam);

                  return (
                    <TableRow key={exam.id}>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold leading-5 text-foreground">
                            {exam.name}
                          </p>
                          <p className="mt-1 break-all font-mono text-[10px] text-muted">
                            ID: {exam.id}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-wrap gap-1">
                          {subjectNames.map((name) => (
                            <span
                              key={name}
                              className="max-w-full rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold leading-4 text-foreground"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0">
                          <p className="break-words text-xs font-semibold leading-5 text-foreground">
                            {topicNames.join(", ") || "No topics"}
                          </p>
                          <p className="mt-1 break-words text-[11px] font-medium leading-4 text-muted">
                            {sourceName}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="min-w-0 text-xs leading-5">
                          <p className="break-words font-semibold text-foreground">
                            Publish: {timeline.publish}
                          </p>
                          <p className="mt-1 break-words font-medium text-muted">
                            Expire: {timeline.expire}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top font-semibold text-foreground">
                        {exam.durationIntMinutes}
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <PdfLink
                            href={exam.questionPDF}
                            label={getExamPdfLabel(
                              exam.questionPDFName,
                              "View question",
                            )}
                          />
                          <PdfLink
                            href={exam.demoAnswerPDF}
                            label={getExamPdfLabel(
                              exam.demoAnswerPDFName,
                              "View answer",
                            )}
                          />
                        </div>
                      </TableTd>
                      <TableTd className="px-3 align-top">
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <StatusToggle
                            checked={Boolean(exam.status)}
                            label={`Set ${exam.name} active status`}
                            onChange={(checked) =>
                              handleStatusChange(exam, checked)
                            }
                          />
                          <span className="text-[11px] font-semibold text-muted">
                            {exam.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableTd>
                      <TableTd className="px-2 align-top">
                        <ExamActionMenu exam={exam} onDelete={handleDelete} />
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd colSpan={8} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No exams found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a new exam.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
    </div>
  );
}
