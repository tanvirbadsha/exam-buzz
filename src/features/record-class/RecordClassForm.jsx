"use client";

import {
  BookOpenText,
  CalendarClock,
  FileText,
  FolderOpen,
  Link as LinkIcon,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { HierarchicalSubjectDropdown } from "@/features/subjects/HierarchicalSubjectDropdown";
import {
  NO_EXAM_VALUE,
  RECORD_CLASS_EXAM_OPTIONS,
  isValidYoutubeUrl,
} from "@/lib/recordClassData";

const emptyRecordClass = {
  title: "",
  categoryId: "",
  subjectId: "",
  materialFolderId: "",
  examId: "",
  publishAt: "",
  youtubeUrl: "",
};

const NO_MATERIAL_FOLDER_VALUE = "__no_material_folder__";

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

function buildMaterialFolderOptions(subjectIndex, topicsBySubjectId, subjectId) {
  if (!subjectId || !subjectIndex.subjectsById.has(subjectId)) {
    return [{ label: "No material folder", value: NO_MATERIAL_FOLDER_VALUE }];
  }

  const subjectIds = getDescendantIds(subjectIndex.childrenMap, subjectId);
  subjectIds.add(subjectId);
  const options = [{ label: "No material folder", value: NO_MATERIAL_FOLDER_VALUE }];

  subjectIds.forEach((currentSubjectId) => {
    const subjectPath = getSubjectPath(
      subjectIndex.subjectsById,
      currentSubjectId,
    );
    const subjectPathLabel = subjectPath
      .map((subject) => subject.name)
      .join(" / ");

    sortByName(topicsBySubjectId.get(currentSubjectId) || []).forEach(
      (topic) => {
        options.push({
          label: topic.name,
          value: topic.id,
          meta: subjectPathLabel,
          searchText: `${topic.name} ${subjectPathLabel}`,
        });
      },
    );
  });

  return options;
}

function buildInitialForm(recordClass) {
  return { ...emptyRecordClass, ...recordClass };
}

function buildErrors(form, categoryIds, subjectIds, availableExamIds, materialFolderIds) {
  const errors = {};

  if (!form.categoryId || !categoryIds.has(form.categoryId)) {
    errors.categoryId = { message: "Select a valid category or sub-category." };
  }

  if (!form.subjectId || !subjectIds.has(form.subjectId)) {
    errors.subjectId = { message: "Select a valid subject." };
  }

  if (!form.title.trim()) {
    errors.title = { message: "Recorded class name is required." };
  }

  if (!form.publishAt) {
    errors.publishAt = { message: "Publish date and time are required." };
  } else if (Number.isNaN(new Date(form.publishAt).getTime())) {
    errors.publishAt = { message: "Enter a valid publish date and time." };
  }

  if (!form.youtubeUrl.trim()) {
    errors.youtubeUrl = { message: "YouTube URL is required." };
  } else if (!isValidYoutubeUrl(form.youtubeUrl.trim())) {
    errors.youtubeUrl = { message: "Enter a valid YouTube video URL." };
  }

  if (form.examId && !availableExamIds.has(form.examId)) {
    errors.examId = {
      message: "Select an exam that belongs to the selected category.",
    };
  }

  if (form.materialFolderId && !materialFolderIds.has(form.materialFolderId)) {
    errors.materialFolderId = {
      message: "Select a folder that belongs to the selected subject.",
    };
  }

  return errors;
}

export function RecordClassForm({
  categoryIndex,
  categoryOptions,
  recordClass,
  subjectIndex,
  topicsBySubjectId,
  onSubmit,
  secondaryAction,
  submitLabel = "Save recorded class",
}) {
  const initialForm = useMemo(() => buildInitialForm(recordClass), [recordClass]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const categoryIds = useMemo(
    () => new Set(categoryOptions.map((option) => option.value)),
    [categoryOptions],
  );
  const subjectOptions = useMemo(
    () => buildSubjectOptions(subjectIndex.childrenMap),
    [subjectIndex.childrenMap],
  );
  const subjectIds = useMemo(
    () => new Set(subjectOptions.map((option) => option.value)),
    [subjectOptions],
  );

  const examOptions = useMemo(() => {
    if (!form.categoryId || !categoryIds.has(form.categoryId)) {
      return [{ label: "No exam", value: NO_EXAM_VALUE }];
    }

    const selectedCategoryIds = getDescendantIds(
      categoryIndex.childrenMap,
      form.categoryId,
    );
    selectedCategoryIds.add(form.categoryId);

    const matchingExams = RECORD_CLASS_EXAM_OPTIONS.filter((examOption) =>
      selectedCategoryIds.has(examOption.categoryId),
    );

    return [{ label: "No exam", value: NO_EXAM_VALUE }, ...matchingExams];
  }, [categoryIds, categoryIndex.childrenMap, form.categoryId]);

  const availableExamIds = useMemo(
    () =>
      new Set(
        examOptions
          .filter((option) => option.value !== NO_EXAM_VALUE)
          .map((option) => option.value),
      ),
    [examOptions],
  );
  const materialFolderOptions = useMemo(
    () =>
      buildMaterialFolderOptions(
        subjectIndex,
        topicsBySubjectId,
        form.subjectId,
      ),
    [form.subjectId, subjectIndex, topicsBySubjectId],
  );
  const materialFolderIds = useMemo(
    () =>
      new Set(
        materialFolderOptions
          .filter((option) => option.value !== NO_MATERIAL_FOLDER_VALUE)
          .map((option) => option.value),
      ),
    [materialFolderOptions],
  );

  const updateField = (field, value) => {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "categoryId" && currentForm.categoryId !== value) {
        const descendantIds = getDescendantIds(categoryIndex.childrenMap, value);
        descendantIds.add(value);
        const examStillMatches = RECORD_CLASS_EXAM_OPTIONS.some(
          (examOption) =>
            examOption.value === currentForm.examId &&
            descendantIds.has(examOption.categoryId),
        );

        if (!examStillMatches) {
          nextForm.examId = "";
        }
      }

      if (field === "subjectId" && currentForm.subjectId !== value) {
        const subjectIdsToCheck = getDescendantIds(
          subjectIndex.childrenMap,
          value,
        );
        subjectIdsToCheck.add(value);
        const folderStillMatches = Array.from(subjectIdsToCheck).some(
          (subjectId) =>
            (topicsBySubjectId.get(subjectId) || []).some(
              (topic) => topic.id === currentForm.materialFolderId,
            ),
        );

        if (!folderStillMatches) {
          nextForm.materialFolderId = "";
        }
      }

      return nextForm;
    });
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      if (field === "categoryId") delete nextErrors.examId;
      if (field === "subjectId") delete nextErrors.materialFolderId;
      return nextErrors;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(
      form,
      categoryIds,
      subjectIds,
      availableExamIds,
      materialFolderIds,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...form,
      title: form.title.trim(),
      examId: form.examId === NO_EXAM_VALUE ? "" : form.examId,
      materialFolderId:
        form.materialFolderId === NO_MATERIAL_FOLDER_VALUE
          ? ""
          : form.materialFolderId,
      youtubeUrl: form.youtubeUrl.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <HierarchicalCategoryDropdown
            label="Category / sub-category"
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

        <CustomDropdown
          label="Exam name"
          icon={Trophy}
          options={examOptions}
          value={form.examId || NO_EXAM_VALUE}
          onChange={(option) =>
            updateField(
              "examId",
              option.value === NO_EXAM_VALUE ? "" : option.value,
            )
          }
          error={errors.examId}
          placeholder="Select exam"
          searchPlaceholder="Search exams..."
          helperText={
            examOptions.length === 1
              ? "No exam is available for the selected category."
              : "Optional. Use only when the class belongs to an exam syllabus."
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <HierarchicalSubjectDropdown
            label="Subject"
            options={subjectOptions}
            value={form.subjectId}
            onChange={(option) => updateField("subjectId", option.value)}
            placeholder="Select subject"
            searchPlaceholder="Search subjects..."
          />
          {errors.subjectId && (
            <span className="field-error mt-1.5 block" role="alert">
              {errors.subjectId.message}
            </span>
          )}
        </div>

        <CustomDropdown
          label="Material folder"
          icon={form.subjectId ? FolderOpen : BookOpenText}
          options={materialFolderOptions}
          value={form.materialFolderId || NO_MATERIAL_FOLDER_VALUE}
          onChange={(option) =>
            updateField(
              "materialFolderId",
              option.value === NO_MATERIAL_FOLDER_VALUE ? "" : option.value,
            )
          }
          error={errors.materialFolderId}
          disabled={!form.subjectId}
          placeholder="Select material folder"
          searchPlaceholder="Search folders..."
          helperText={
            form.subjectId && materialFolderOptions.length === 1
              ? "No material folders are available for this subject yet."
              : "Optional. Choose the folder where this class should appear."
          }
        />
      </div>

      <TextInput
        label="Recorded class name"
        name="title"
        icon={FileText}
        value={form.title}
        onChange={(event) => updateField("title", event.target.value)}
        error={errors.title}
        placeholder="BCS written answer planning"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Publish date and time"
          name="publishAt"
          type="datetime-local"
          icon={CalendarClock}
          value={form.publishAt}
          onChange={(event) => updateField("publishAt", event.target.value)}
          error={errors.publishAt}
        />

        <TextInput
          label="YouTube URL"
          name="youtubeUrl"
          type="url"
          icon={LinkIcon}
          value={form.youtubeUrl}
          onChange={(event) => updateField("youtubeUrl", event.target.value)}
          error={errors.youtubeUrl}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button type="submit" className="button button-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
