"use client";

import CustomSearch from "@/components/ui/CustomSearch";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { Pagination } from "@/components/ui/Pagination";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from "@/components/ui/CustomTable";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { useGetAllExamsQuery } from "@/features/exams/exam/api/examApi";
import {
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useGetAllSectionsQuery,
  useUpdateSectionMutation,
} from "@/features/exams/sections/api/sectionApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  ALL_SECTIONS_EXAM_VALUE,
  formatSectionDate,
  getSectionExamId,
} from "@/lib/sectionData";
import {
  BookOpenCheck,
  Eye,
  FileText,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SectionModal } from "./SectionModal";

const ITEMS_PER_PAGE = 6;
const EXAM_OPTIONS_LIMIT = 1000;

function getExamName(exam) {
  return exam?.name || "Unknown exam";
}

function buildExamOptions(exams, sections) {
  const examsById = new Map();

  exams.forEach((exam) => {
    if (exam?.id === undefined || exam?.id === null) return;
    examsById.set(String(exam.id), exam);
  });

  sections.forEach((section) => {
    const exam = section.exam;
    if (!exam || exam.id === undefined || exam.id === null) return;
    const key = String(exam.id);
    if (!examsById.has(key)) {
      examsById.set(key, exam);
    }
  });

  return [...examsById.values()]
    .sort((firstExam, secondExam) =>
      getExamName(firstExam).localeCompare(getExamName(secondExam)),
    )
    .map((exam) => ({
      label: getExamName(exam),
      value: exam.id,
      depth: 0,
      meta: getExamName(exam),
      searchText: `${getExamName(exam)} ${exam.id} ${exam.category?.name || ""}`,
      exam,
    }));
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.data?.message ||
    error?.error ||
    error?.message ||
    fallbackMessage
  );
}

function getExamsFromResponse(response) {
  return Array.isArray(response?.exams) ? response.exams : [];
}

function getSectionsFromResponse(response) {
  return Array.isArray(response?.sections) ? response.sections : [];
}

function normalizeApiId(value) {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}

function buildSectionPayload(sectionInput) {
  return {
    examID: normalizeApiId(sectionInput.examID),
    name: sectionInput.name.trim(),
    maxPapers: Number(sectionInput.maxPapers),
  };
}

function buildSectionUpdateBody(section, sectionInput) {
  const nextPayload = buildSectionPayload(sectionInput);
  const body = {};

  if (String(getSectionExamId(section)) !== String(nextPayload.examID)) {
    body.examID = nextPayload.examID;
  }

  if ((section.name || "").trim() !== nextPayload.name) {
    body.name = nextPayload.name;
  }

  if (Number(section.maxPapers) !== nextPayload.maxPapers) {
    body.maxPapers = nextPayload.maxPapers;
  }

  return body;
}

function SectionActionMenu({ onDelete, onEdit, section }) {
  return (
    <FloatingActionMenu
      ariaLabel={`Open actions for ${section.name}`}
      menuHeight={136}
    >
      {({ closeMenu }) => (
        <>
          <Link
            href={`/sections/${section.id}/view`}
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
              onEdit(section);
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
              onDelete(section);
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

function SectionMobileCard({ onDelete, onEdit, section }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">
            {section.name}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-muted">
            ID: {section.id}
          </p>
        </div>
        <SectionActionMenu
          section={section}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Exam
          </p>
          <p className="mt-1 break-words font-semibold text-foreground">
            {section.exam?.name || "Unknown exam"}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-muted">
            Exam ID: {getSectionExamId(section) || "Not selected"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Max papers
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {section.maxPapers}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Created
            </p>
            <p className="mt-1 break-words text-xs font-semibold text-foreground">
              {formatSectionDate(section.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Updated
            </p>
            <p className="mt-1 break-words text-xs text-muted">
              {formatSectionDate(section.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SectionManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState(ALL_SECTIONS_EXAM_VALUE);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    section: null,
  });
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);
  const {
    data: sectionsData,
    error: sectionsError,
    isFetching: isFetchingSections,
    isLoading: isLoadingSections,
    refetch,
  } = useGetAllSectionsQuery();
  const { data: examsData, isFetching: isFetchingExams } = useGetAllExamsQuery({
    page: 1,
    limit: EXAM_OPTIONS_LIMIT,
  });
  const [createSection, { isLoading: isCreating }] =
    useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] =
    useUpdateSectionMutation();
  const [deleteSection, { isLoading: isDeleting }] =
    useDeleteSectionMutation();

  const sections = useMemo(
    () => getSectionsFromResponse(sectionsData),
    [sectionsData],
  );
  const exams = useMemo(() => getExamsFromResponse(examsData), [examsData]);
  const isSubmitting = isCreating || isUpdating;
  const isBusy = isSubmitting || isDeleting;

  const examsById = useMemo(
    () => new Map(exams.map((exam) => [String(exam.id), exam])),
    [exams],
  );
  const examOptions = useMemo(
    () => buildExamOptions(exams, sections),
    [exams, sections],
  );
  const examFilterOptions = useMemo(
    () => [
      {
        label: "All exams",
        value: ALL_SECTIONS_EXAM_VALUE,
        depth: 0,
        meta: "Any exam",
        searchText: "all exams",
      },
      ...examOptions,
    ],
    [examOptions],
  );
  const enrichedSections = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        exam:
          section.exam ||
          examsById.get(String(getSectionExamId(section))) ||
          null,
      })),
    [examsById, sections],
  );

  const filteredSections = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();

    return enrichedSections.filter((section) => {
      const examId = getSectionExamId(section);
      const matchesExam =
        examFilter === ALL_SECTIONS_EXAM_VALUE ||
        String(examId) === String(examFilter);
      const matchesSearch =
        !query ||
        [
          section.id,
          section.name,
          examId,
          section.exam?.name,
          section.maxPapers,
          section.createdAt,
          section.updatedAt,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesExam && matchesSearch;
    });
  }, [debouncedSearchQuery, enrichedSections, examFilter]);

  const totals = useMemo(
    () =>
      sections.reduce(
        (summary, section) => ({
          total: summary.total + 1,
          capacity: summary.capacity + (Number(section.maxPapers) || 0),
        }),
        { total: 0, capacity: 0 },
      ),
    [sections],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSections.length / ITEMS_PER_PAGE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const paginatedSections = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredSections.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activePage, filteredSections]);

  const handleSearchChange = (nextSearchQuery) => {
    setSearchQuery(nextSearchQuery);
    setCurrentPage(1);
  };

  const handleExamFilterChange = (option) => {
    setExamFilter(option.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setExamFilter(ALL_SECTIONS_EXAM_VALUE);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", section: null });
  };

  const openEditModal = (section) => {
    setModalState({ isOpen: true, mode: "edit", section });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleSectionSubmit = async (sectionInput) => {
    if (modalState.mode === "edit" && modalState.section) {
      const body = buildSectionUpdateBody(modalState.section, sectionInput);

      if (Object.keys(body).length === 0) {
        toast.success("No section changes to save.");
        return true;
      }

      try {
        const response = await updateSection({
          id: modalState.section.id,
          body,
        }).unwrap();
        toast.success(
          `${response?.section?.name || body.name || modalState.section.name} updated.`,
        );
        return true;
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Section could not be updated."),
        );
        return false;
      }
    }

    const payload = buildSectionPayload(sectionInput);

    try {
      const response = await createSection(payload).unwrap();
      toast.success(`${response?.section?.name || payload.name} created.`);
      resetFilters();
      return true;
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Section could not be created."),
      );
      return false;
    }
  };

  const handleDelete = async (section) => {
    const confirmed = window.confirm(`Delete ${section.name}?`);
    if (!confirmed) return;

    try {
      await deleteSection(section.id).unwrap();
      toast.success(`${section.name} deleted.`);
      if (paginatedSections.length === 1 && currentPage > 1) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Section could not be deleted."),
      );
    }
  };

  if (sectionsError && sections.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Sections
          </h1>
        </div>
        <div
          className="mx-auto w-full max-w-3xl rounded-lg border border-rose-200 bg-rose-50 px-5 py-6 text-rose-950"
          role="alert"
        >
          <h2 className="text-base font-bold">Unable to load sections</h2>
          <p className="mt-1 text-sm leading-6 text-rose-800">
            {getApiErrorMessage(
              sectionsError,
              "The section list could not be loaded.",
            )}
          </p>
          <button
            type="button"
            className="button button-secondary mt-4 bg-white"
            onClick={refetch}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingSections && sections.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Sections
          </h1>
        </div>
        <div className="surface-card py-12 text-center">
          <p className="font-semibold text-foreground">Loading sections...</p>
          <p className="mt-1 text-sm text-muted">
            Fetching sections and exam options.
          </p>
        </div>
      </div>
    );
  }

  const sectionsSummary = isFetchingSections
    ? "Refreshing sections..."
    : `${filteredSections.length} of ${sections.length} sections shown`;

  const examDropdownPlaceholder = isFetchingExams
    ? "Loading exams..."
    : "All exams";

  const canCreateSection = examOptions.length > 0 && !isFetchingExams;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Exam management
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Sections
          </h1>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-6 py-5">
            <p className="text-xs font-semibold text-muted">Total</p>
            <p className="mt-2 text-3xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-muted">Visible</p>
            <p className="mt-2 text-3xl font-black text-foreground">
              {filteredSections.length}
            </p>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Section list
              </h2>
              <p className="text-sm text-muted">
                {sectionsSummary}
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 sm:items-end xl:grid-cols-[minmax(16rem,1fr)_minmax(14rem,16rem)_auto_auto] lg:min-w-0 lg:flex-1">
              <CustomSearch
                placeholder="Search by section, exam, or ID..."
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
                ariaLabel="Search sections"
                wide
              />
              <HierarchicalCategoryDropdown
                label="Exam"
                icon={BookOpenCheck}
                options={examFilterOptions}
                value={examFilter}
                onChange={handleExamFilterChange}
                placeholder={examDropdownPlaceholder}
                searchPlaceholder="Search exams..."
              />
              <button
                type="button"
                className="button button-secondary min-h-10 sm:self-end"
                onClick={resetFilters}
              >
                <RotateCcw size={15} />
                Reset
              </button>
              <button
                type="button"
                className="button button-primary min-h-10 sm:self-end"
                onClick={openCreateModal}
                disabled={!canCreateSection || isBusy}
              >
                <Plus size={16} />
                Create section
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {paginatedSections.length > 0 ? (
            paginatedSections.map((section) => (
              <SectionMobileCard
                key={section.id}
                section={section}
                onDelete={handleDelete}
                onEdit={openEditModal}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-muted">
                <FileText size={20} />
              </div>
              <p className="mt-3 font-semibold text-foreground">
                No sections found
              </p>
              <p className="mt-1 text-sm text-muted">
                Adjust the filters or create a section.
              </p>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Table className="table-fixed text-xs">
            <colgroup>
              <col className="w-[7%]" />
              <col className="w-[20%]" />
              <col className="w-[27%]" />
              <col className="w-[9%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHead>
              <tr>
                <TableTh className="px-2">Serial</TableTh>
                <TableTh className="px-2">Section</TableTh>
                <TableTh className="px-2">Exam</TableTh>
                <TableTh className="px-2">Max papers</TableTh>
                <TableTh className="px-2">Created</TableTh>
                <TableTh className="px-2">Updated</TableTh>
                <TableTh className="px-2 text-right">Actions</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {paginatedSections.length > 0 ? (
                paginatedSections.map((section, index) => (
                  <TableRow key={section.id}>
                    <TableTd className="break-words px-2 align-top font-mono text-xs text-muted">
                      {String(
                        (activePage - 1) * ITEMS_PER_PAGE + index + 1,
                      ).padStart(2, "0")}
                    </TableTd>
                    <TableTd className="px-2 align-top">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong lg:flex">
                          <Layers3 size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-foreground">
                            {section.name}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] text-muted">
                            ID: {section.id}
                          </p>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="px-2 align-top">
                      <p className="break-words font-semibold text-foreground">
                        {section.exam?.name || "Unknown exam"}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] text-muted">
                        Exam ID: {getSectionExamId(section) || "Not selected"}
                      </p>
                    </TableTd>
                    <TableTd className="break-words px-2 align-top font-semibold text-foreground">
                      {section.maxPapers}
                    </TableTd>
                    <TableTd className="break-words px-2 align-top text-xs font-semibold leading-5 text-foreground">
                      {formatSectionDate(section.createdAt)}
                    </TableTd>
                    <TableTd className="break-words px-2 align-top text-xs leading-5 text-muted">
                      {formatSectionDate(section.updatedAt)}
                    </TableTd>
                    <TableTd className="px-2 align-top">
                      <SectionActionMenu
                        section={section}
                        onDelete={handleDelete}
                        onEdit={openEditModal}
                      />
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableTd colSpan={8} className="py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <FileText size={20} />
                    </div>
                    <p className="mt-3 font-semibold text-foreground">
                      No sections found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a section.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={activePage}
          totalItems={filteredSections.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </TableContainer>

      <SectionModal
        examOptions={examOptions}
        isOpen={modalState.isOpen}
        isSubmitting={isSubmitting}
        mode={modalState.mode}
        onClose={closeModal}
        onSubmit={handleSectionSubmit}
        section={modalState.section}
      />
    </div>
  );
}
