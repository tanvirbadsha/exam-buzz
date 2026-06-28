"use client";

import {
  BookOpenText,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  Hash,
  PackageCheck,
  Search,
  Timer,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { TextInput } from "@/components/ui/forms/TextInput";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import {
  ACCEPTED_EXAM_PDF_TYPES,
  EXAM_PDF_MAX_FILE_SIZE,
  getExamCategoryId,
  isValidExamDate,
  isValidExamTime,
} from "@/lib/examData";

const emptyExam = {
  name: "",
  categoryId: "",
  subjectIds: [],
  topicIds: [],
  durationIntMinutes: "",
  passMark: "",
  publishedDate: "",
  publishedTime: "00:00",
  expiredDate: "",
  expiredTime: "00:00",
  questionPDF: "",
  questionPDFName: "",
  questionPDFFile: null,
  demoAnswerPDF: "",
  demoAnswerPDFName: "",
  demoAnswerPDFFile: null,
  packageId: "",
  status: true,
};

const VIEWPORT_GAP = 8;
const DROPDOWN_MAX_HEIGHT = 288;
const INDENT_WIDTH = 24;

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildTreeOptions(childrenMap) {
  const options = [];
  const visitedIds = new Set();

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

    children.forEach((item) => {
      const itemId = String(item.id ?? "");
      if (!itemId || visitedIds.has(itemId)) return;

      visitedIds.add(itemId);
      const path = [...parentPath, item.name];
      options.push({
        label: item.name,
        value: itemId,
        depth,
        meta: path.join(" / "),
        searchText: path.join(" "),
      });
      walk(itemId, depth + 1, path);
    });
  };

  walk();
  return options;
}

function uniqueOptionsByValue(options) {
  const seenValues = new Set();

  return options.filter((option) => {
    const value = String(option.value ?? "");
    if (!value || seenValues.has(value)) return false;
    seenValues.add(value);
    return true;
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildOptionTree(options) {
  const rootNodes = [];
  const nodesByValue = new Map();
  const stack = [];

  options.forEach((option) => {
    const depth = Math.max(0, Number(option.depth) || 0);
    const node = {
      ...option,
      children: [],
      depth,
      parentValue: null,
    };

    while (stack.length > depth) {
      stack.pop();
    }

    const parentNode = depth > 0 ? stack[depth - 1] : null;
    if (parentNode) {
      node.parentValue = parentNode.value;
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }

    stack[depth] = node;
    nodesByValue.set(node.value, node);
  });

  return { rootNodes, nodesByValue };
}

function collectDescendantValues(node, descendantValues = new Set()) {
  node.children.forEach((childNode) => {
    descendantValues.add(childNode.value);
    collectDescendantValues(childNode, descendantValues);
  });

  return descendantValues;
}

function flattenVisibleNodes(nodes, expandedValues, visibleNodes = []) {
  nodes.forEach((node) => {
    visibleNodes.push(node);

    if (node.children.length > 0 && expandedValues.has(node.value)) {
      flattenVisibleNodes(node.children, expandedValues, visibleNodes);
    }
  });

  return visibleNodes;
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

function toDateInputValue(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(value || ""));
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function fromDateInputValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function getPdfFileField(pdfField) {
  return `${pdfField}File`;
}

function buildInitialForm(exam) {
  if (!exam) return emptyExam;

  return {
    ...emptyExam,
    ...exam,
    categoryId: String(getExamCategoryId(exam) || ""),
    subjectIds: Array.isArray(exam.subjectIds)
      ? exam.subjectIds.map((subjectId) => String(subjectId))
      : [],
    topicIds: Array.isArray(exam.topicIds)
      ? exam.topicIds.map((topicId) => String(topicId))
      : [],
    durationIntMinutes: String(exam.durationIntMinutes || ""),
    passMark: String(exam.passMark || ""),
    status: typeof exam.status === "boolean" ? exam.status : true,
  };
}

function buildErrors(form, categoryIds, subjectIds, topicIds) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = { message: "Exam name is required." };
  }

  if (!form.categoryId || !categoryIds.has(form.categoryId)) {
    errors.categoryId = { message: "Select a valid category." };
  }

  if (form.subjectIds.length === 0) {
    errors.subjectIds = { message: "Select at least one subject." };
  } else if (form.subjectIds.some((subjectId) => !subjectIds.has(subjectId))) {
    errors.subjectIds = { message: "Select valid subjects." };
  }

  if (form.topicIds.length === 0) {
    errors.topicIds = { message: "Select at least one topic." };
  } else if (form.topicIds.some((topicId) => !topicIds.has(topicId))) {
    errors.topicIds = { message: "Select valid topics." };
  }

  if (!form.durationIntMinutes) {
    errors.durationIntMinutes = { message: "Duration is required." };
  } else if (Number(form.durationIntMinutes) <= 0) {
    errors.durationIntMinutes = { message: "Duration must be greater than 0." };
  }

  if (!form.passMark) {
    errors.passMark = { message: "Pass mark is required." };
  } else if (Number(form.passMark) < 0) {
    errors.passMark = { message: "Pass mark cannot be negative." };
  }

  if (!isValidExamDate(form.publishedDate)) {
    errors.publishedDate = {
      message: "Publish date must be in dd-mm-yyyy format.",
    };
  }

  if (!isValidExamTime(form.publishedTime)) {
    errors.publishedTime = {
      message: "Publish time must be in HH:mm 24-hour format.",
    };
  }

  if (!isValidExamDate(form.expiredDate)) {
    errors.expiredDate = {
      message: "Expire date must be in dd-mm-yyyy format.",
    };
  }

  if (!isValidExamTime(form.expiredTime)) {
    errors.expiredTime = {
      message: "Expire time must be in HH:mm 24-hour format.",
    };
  }

  return errors;
}

function MultiSelectDropdown({
  emptyText = "No options available.",
  error,
  helperText,
  icon: Icon,
  label,
  onChange,
  options,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  value,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedValues, setExpandedValues] = useState(() => new Set());
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const selectedValues = useMemo(() => new Set(value), [value]);
  const { rootNodes, nodesByValue } = useMemo(
    () => buildOptionTree(options),
    [options],
  );
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(option.value)),
    [options, selectedValues],
  );
  const visibleOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return flattenVisibleNodes(rootNodes, expandedValues);

    return options.filter((option) =>
      (option.searchText || `${option.label} ${option.meta || ""}`)
        .toLowerCase()
        .includes(query),
    );
  }, [expandedValues, options, rootNodes, searchQuery]);

  const updateMenuPosition = () => {
    const trigger = wrapperRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
    const maxLeft = window.innerWidth - width - VIEWPORT_GAP;
    const left = clamp(rect.left, VIEWPORT_GAP, maxLeft);
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const spaceAbove = rect.top - VIEWPORT_GAP;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const availableHeight = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(
      160,
      Math.min(DROPDOWN_MAX_HEIGHT, availableHeight),
    );
    const top = openUp
      ? Math.max(VIEWPORT_GAP, rect.top - maxHeight - VIEWPORT_GAP)
      : rect.bottom + VIEWPORT_GAP;

    setMenuPosition({ left, top, width, maxHeight });
  };

  const openDropdown = () => {
    updateMenuPosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();

    const handlePointerDown = (event) => {
      if (
        wrapperRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
      setSearchQuery("");
    };
    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  const toggleValue = (optionValue) => {
    const nextValues = new Set(selectedValues);
    if (nextValues.has(optionValue)) {
      nextValues.delete(optionValue);
    } else {
      nextValues.add(optionValue);
    }
    onChange(Array.from(nextValues));
  };

  const removeValue = (optionValue) => {
    onChange(value.filter((currentValue) => currentValue !== optionValue));
  };

  const toggleOptionExpansion = (option) => {
    if (!option?.children?.length) return;

    setExpandedValues((currentValues) => {
      const nextValues = new Set(currentValues);
      if (nextValues.has(option.value)) {
        nextValues.delete(option.value);
        collectDescendantValues(option).forEach((descendantValue) =>
          nextValues.delete(descendantValue),
        );
      } else {
        nextValues.add(option.value);
      }
      return nextValues;
    });
  };

  return (
    <div ref={wrapperRef} className="field-group relative">
      {label && <span className="field-label">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className={`field-shell min-h-11 w-full px-3 text-left ${
          error ? "field-shell-error" : ""
        }`}
      >
        {Icon && <Icon size={16} className="mr-2.5 shrink-0 text-muted" />}
        <span
          className={`field-input flex-1 truncate ${
            selectedOptions.length > 0 ? "" : "text-[#94a39a]"
          }`}
        >
          {selectedOptions.length > 0
            ? `${selectedOptions.length} selected`
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option, index) => (
            <span
              key={`selected-${option.value}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-bold text-brand-strong"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={() => removeValue(option.value)}
                className="rounded-sm text-brand-strong hover:bg-white/70"
                aria-label={`Remove ${option.label}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen &&
        createPortal(
        <div
          ref={menuRef}
          style={{
            left: `${menuPosition.left}px`,
            top: `${menuPosition.top}px`,
            width: `${menuPosition.width}px`,
          }}
          className="fixed z-[100] overflow-hidden rounded-lg border border-border bg-surface shadow-xl ring-1 ring-slate-950/5"
        >
          <div className="flex items-center border-b border-border px-3">
            <Search size={15} className="mr-2 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="field-input min-h-10"
            />
          </div>

          <div
            className="overflow-y-auto py-1"
            style={{ maxHeight: `${menuPosition.maxHeight}px` }}
            role="listbox"
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option, index) => {
                const checked = selectedValues.has(option.value);
                const depth = Math.max(0, Number(option.depth) || 0);
                const node = nodesByValue.get(option.value) || option;
                const hasChildren = node.children?.length > 0;
                const isExpanded = expandedValues.has(option.value);

                return (
                  <div
                    key={`option-${option.value}-${index}`}
                    role="option"
                    aria-selected={checked}
                    className={`flex min-h-10 items-center gap-2 py-2 pr-3 text-sm transition-colors hover:bg-brand-soft ${
                      checked
                        ? "font-semibold text-brand-strong"
                        : "text-foreground"
                    }`}
                    style={{ paddingLeft: `${12 + depth * 24}px` }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-white hover:text-brand-strong"
                        aria-label={`${isExpanded ? "Hide" : "Show"} nested options for ${option.label}`}
                        aria-expanded={isExpanded}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleOptionExpansion(node);
                        }}
                      >
                        <ChevronRight
                          size={15}
                          className={`transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="h-5 w-5 shrink-0" aria-hidden="true" />
                    )}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleValue(option.value)}
                      className="h-4 w-4 rounded border-border text-brand"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted">{emptyText}</p>
            )}
          </div>
        </div>,
        document.body,
      )}

      {helperText && !error && <span className="text-xs text-muted">{helperText}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error.message}
        </span>
      )}
    </div>
  );
}

export function ExamForm({
  categoryIndex,
  categoryOptions,
  exam,
  isSubmitting = false,
  onSubmit,
  packageOptions = [],
  secondaryAction,
  showStatusField = true,
  submitLabel = "Create exam",
  subjectIndex,
  topics,
}) {
  const initialForm = useMemo(() => buildInitialForm(exam), [exam]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [questionFileInputKey, setQuestionFileInputKey] = useState(0);
  const [answerFileInputKey, setAnswerFileInputKey] = useState(0);

  const categoryIds = useMemo(
    () => new Set(categoryOptions.map((option) => String(option.value))),
    [categoryOptions],
  );
  const subjectOptions = useMemo(
    () => buildTreeOptions(subjectIndex.childrenMap),
    [subjectIndex.childrenMap],
  );
  const subjectIds = useMemo(
    () => new Set(subjectOptions.map((option) => String(option.value))),
    [subjectOptions],
  );
  const topicOptions = useMemo(() => {
    const selectedSubjectIds = new Set();
    form.subjectIds.forEach((subjectId) => {
      selectedSubjectIds.add(String(subjectId));
      getDescendantIds(subjectIndex.childrenMap, subjectId).forEach(
        (descendantId) => selectedSubjectIds.add(String(descendantId)),
      );
    });

    return uniqueOptionsByValue(sortByName(topics)
      .filter((topic) => selectedSubjectIds.has(String(topic.subjectId)))
      .map((topic) => ({
        label: topic.name,
        value: String(topic.id ?? ""),
      })));
  }, [
    form.subjectIds,
    subjectIndex.childrenMap,
    topics,
  ]);
  const topicIds = useMemo(
    () => new Set(topicOptions.map((option) => String(option.value))),
    [topicOptions],
  );

  const updateField = (field, value) => {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "subjectIds") {
        const selectedSubjectIds = new Set();
        value.forEach((subjectId) => {
          selectedSubjectIds.add(String(subjectId));
          getDescendantIds(subjectIndex.childrenMap, subjectId).forEach(
            (descendantId) => selectedSubjectIds.add(String(descendantId)),
          );
        });
        nextForm.topicIds = currentForm.topicIds.filter((topicId) => {
          const topic = topics.find(
            (currentTopic) => String(currentTopic.id) === String(topicId),
          );
          return topic && selectedSubjectIds.has(String(topic.subjectId));
        });
      }

      return nextForm;
    });
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      if (field === "subjectIds") delete nextErrors.topicIds;
      return nextErrors;
    });
  };

  const clearPdfField = (pdfField, nameField) => {
    setForm((currentForm) => ({
      ...currentForm,
      [pdfField]: "",
      [nameField]: "",
      [getPdfFileField(pdfField)]: null,
    }));
  };

  const handlePdfChange = async (event, pdfField, nameField, resetKey) => {
    const file = event.target.files?.[0];

    if (!file) {
      clearPdfField(pdfField, nameField);
      resetKey((currentKey) => currentKey + 1);
      return;
    }

    if (!ACCEPTED_EXAM_PDF_TYPES.includes(file.type)) {
      clearPdfField(pdfField, nameField);
      resetKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => ({
        ...currentErrors,
        [pdfField]: { message: "Only PDF files are supported." },
      }));
      return;
    }

    if (file.size > EXAM_PDF_MAX_FILE_SIZE) {
      clearPdfField(pdfField, nameField);
      resetKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => ({
        ...currentErrors,
        [pdfField]: { message: "Upload a PDF that is 5MB or smaller." },
      }));
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      [pdfField]: "",
      [nameField]: file.name,
      [getPdfFileField(pdfField)]: file,
    }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[pdfField];
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(form, categoryIds, subjectIds, topicIds);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const category = categoryIndex.categoriesById.get(form.categoryId);

    onSubmit({
      ...form,
      name: form.name.trim(),
      categoryID: form.categoryId,
      durationIntMinutes: Number(form.durationIntMinutes),
      passMark: Number(form.passMark),
      publishedDate: form.publishedDate.trim(),
      publishedTime: form.publishedTime.trim(),
      expiredDate: form.expiredDate.trim(),
      expiredTime: form.expiredTime.trim(),
      category: category
        ? {
            id: category.id,
            parentID: category.parentId,
            name: category.name,
            icon: null,
            status:
              typeof category.status === "boolean"
                ? category.status
                : category.status === "active",
          }
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="surface-card p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextInput
            label="Exam name"
            name="name"
            icon={FileText}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={errors.name}
            placeholder="BCS Preliminary Model Test 01"
          />

          <div>
            <HierarchicalCategoryDropdown
              label="Category"
              options={categoryOptions}
              value={form.categoryId}
              onChange={(option) => updateField("categoryId", option.value)}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
            />
            {errors.categoryId && (
              <span className="field-error mt-1.5 block" role="alert">
                {errors.categoryId.message}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MultiSelectDropdown
            label="Subject"
            icon={BookOpenText}
            options={subjectOptions}
            value={form.subjectIds}
            onChange={(nextValues) => updateField("subjectIds", nextValues)}
            error={errors.subjectIds}
            placeholder="Select subjects"
            searchPlaceholder="Search subjects..."
            helperText="Select one or more subjects for this exam."
          />

          <MultiSelectDropdown
            label="Topic"
            options={topicOptions}
            value={form.topicIds}
            onChange={(nextValues) => updateField("topicIds", nextValues)}
            error={errors.topicIds}
            placeholder="Select topics"
            searchPlaceholder="Search topics..."
            emptyText="Select subjects first, or add topics under the selected subjects."
            helperText="Topics are filtered by the selected subjects."
          />
        </div>

        <div className="mt-4">
          <CustomDropdown
            label="Package"
            icon={PackageCheck}
            options={packageOptions}
            value={form.packageId}
            onChange={(option) => updateField("packageId", option.value)}
            placeholder="Select package"
            searchPlaceholder="Search packages..."
            helperText="Optional. Select the package where this exam should be included."
          />
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextInput
            label="Duration (in Minutes)"
            name="durationIntMinutes"
            type="number"
            min="1"
            icon={Timer}
            value={form.durationIntMinutes}
            onChange={(event) =>
              updateField("durationIntMinutes", event.target.value)
            }
            error={errors.durationIntMinutes}
            placeholder="60"
          />

          <TextInput
            label="Pass Mark"
            name="passMark"
            type="number"
            min="0"
            icon={Hash}
            value={form.passMark}
            onChange={(event) => updateField("passMark", event.target.value)}
            error={errors.passMark}
            placeholder="40"
          />

          <TextInput
            label="Publish Date"
            name="publishedDate"
            type="date"
            icon={CalendarClock}
            value={toDateInputValue(form.publishedDate)}
            onChange={(event) =>
              updateField("publishedDate", fromDateInputValue(event.target.value))
            }
            error={errors.publishedDate}
          />

          <TextInput
            label="Publish Time"
            name="publishedTime"
            type="time"
            icon={CalendarClock}
            value={form.publishedTime}
            onChange={(event) =>
              updateField("publishedTime", event.target.value)
            }
            error={errors.publishedTime}
          />

          <TextInput
            label="Expire Date"
            name="expiredDate"
            type="date"
            icon={CalendarClock}
            value={toDateInputValue(form.expiredDate)}
            onChange={(event) =>
              updateField("expiredDate", fromDateInputValue(event.target.value))
            }
            error={errors.expiredDate}
          />

          <TextInput
            label="Expire Time"
            name="expiredTime"
            type="time"
            icon={CalendarClock}
            value={form.expiredTime}
            onChange={(event) => updateField("expiredTime", event.target.value)}
            error={errors.expiredTime}
          />

          {showStatusField && (
            <div className="field-group rounded-lg border border-border bg-surface-muted px-4 py-3 md:col-span-2">
              <span className="field-label">Status</span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted">
                  {form.status ? "Active" : "Inactive"}
                </span>
                <StatusToggle
                  checked={form.status}
                  label="Set exam active status"
                  onChange={(checked) => updateField("status", checked)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <FileUpload
            key={`question-pdf-${questionFileInputKey}`}
            label="Question PDF"
            name="questionPDF"
            accept=".pdf,application/pdf"
            error={errors.questionPDF}
            existingUrl={form.questionPDF || (form.questionPDFName ? "document" : "")}
            existingFileName={form.questionPDFName}
            onChange={(event) =>
              handlePdfChange(
                event,
                "questionPDF",
                "questionPDFName",
                setQuestionFileInputKey,
              )
            }
            onRemoveExisting={() => clearPdfField("questionPDF", "questionPDFName")}
            uploadHint="Optional PDF (Max. 5MB)"
          />

          <FileUpload
            key={`answer-pdf-${answerFileInputKey}`}
            label="Demo Answer PDF"
            name="demoAnswerPDF"
            accept=".pdf,application/pdf"
            error={errors.demoAnswerPDF}
            existingUrl={
              form.demoAnswerPDF || (form.demoAnswerPDFName ? "document" : "")
            }
            existingFileName={form.demoAnswerPDFName}
            onChange={(event) =>
              handlePdfChange(
                event,
                "demoAnswerPDF",
                "demoAnswerPDFName",
                setAnswerFileInputKey,
              )
            }
            onRemoveExisting={() =>
              clearPdfField("demoAnswerPDF", "demoAnswerPDFName")
            }
            uploadHint="Optional PDF (Max. 5MB)"
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
