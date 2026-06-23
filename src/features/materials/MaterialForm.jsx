"use client";

import { FileText, FolderOpen, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { FileUpload } from "@/components/ui/forms/FileUpload";
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { TextInput } from "@/components/ui/forms/TextInput";
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import {
  ACCEPTED_MATERIAL_FILE_TYPES,
  MATERIAL_EXAM_OPTIONS,
  MATERIAL_MAX_FILE_SIZE,
} from "@/lib/materialData";

const emptyMaterial = {
  title: "",
  categoryId: "",
  examId: "",
  materialFolderId: "",
  fileName: "",
  fileType: "",
  fileSize: 0,
  fileDataUrl: "",
};

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function buildInitialForm(material) {
  return { ...emptyMaterial, ...material };
}

function buildErrors(form, categoryIds, examIds, materialFolderIds) {
  const errors = {};

  if (!form.categoryId || !categoryIds.has(form.categoryId)) {
    errors.categoryId = { message: "Select a valid category or sub-category." };
  }

  if (!form.examId || !examIds.has(form.examId)) {
    errors.examId = {
      message: "Select an exam that belongs to the selected category.",
    };
  }

  if (!form.materialFolderId || !materialFolderIds.has(form.materialFolderId)) {
    errors.materialFolderId = { message: "Select a valid material folder." };
  }

  if (!form.title.trim()) {
    errors.title = { message: "Material name is required." };
  }

  if (!form.fileName) {
    errors.file = { message: "Upload a PDF, JPG, or PNG file." };
  }

  return errors;
}

function clearMaterialFileFields(currentForm) {
  return {
    ...currentForm,
    fileName: "",
    fileType: "",
    fileSize: 0,
    fileDataUrl: "",
  };
}

export function MaterialForm({
  categoryIndex,
  categoryOptions,
  material,
  materialFolderOptions,
  onSubmit,
  secondaryAction,
  submitLabel = "Upload material",
}) {
  const initialForm = useMemo(() => buildInitialForm(material), [material]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [fileInputKey, setFileInputKey] = useState(0);

  const categoryIds = useMemo(
    () => new Set(categoryOptions.map((option) => option.value)),
    [categoryOptions],
  );
  const materialFolderIds = useMemo(
    () => new Set(materialFolderOptions.map((option) => option.value)),
    [materialFolderOptions],
  );

  const examOptions = useMemo(() => {
    if (!form.categoryId || !categoryIds.has(form.categoryId)) return [];

    const selectedCategoryIds = getDescendantIds(
      categoryIndex.childrenMap,
      form.categoryId,
    );
    selectedCategoryIds.add(form.categoryId);

    return MATERIAL_EXAM_OPTIONS.filter((examOption) =>
      selectedCategoryIds.has(examOption.categoryId),
    );
  }, [categoryIds, categoryIndex.childrenMap, form.categoryId]);

  const examIds = useMemo(
    () => new Set(examOptions.map((option) => option.value)),
    [examOptions],
  );

  const updateField = (field, value) => {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "categoryId" && currentForm.categoryId !== value) {
        const selectedCategoryIds = getDescendantIds(
          categoryIndex.childrenMap,
          value,
        );
        selectedCategoryIds.add(value);

        const examStillMatches = MATERIAL_EXAM_OPTIONS.some(
          (examOption) =>
            examOption.value === currentForm.examId &&
            selectedCategoryIds.has(examOption.categoryId),
        );

        if (!examStillMatches) {
          nextForm.examId = "";
        }
      }

      return nextForm;
    });
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      if (field === "categoryId") delete nextErrors.examId;
      return nextErrors;
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm(clearMaterialFileFields);
      setFileInputKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.file;
        return nextErrors;
      });
      return;
    }

    if (!ACCEPTED_MATERIAL_FILE_TYPES.includes(file.type)) {
      setForm(clearMaterialFileFields);
      setFileInputKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: { message: "Only PDF, JPG, and PNG files are supported." },
      }));
      return;
    }

    if (file.size > MATERIAL_MAX_FILE_SIZE) {
      setForm(clearMaterialFileFields);
      setFileInputKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: { message: "Upload a file that is 2MB or smaller." },
      }));
      return;
    }

    try {
      const fileDataUrl = await readFileAsDataUrl(file);
      setForm((currentForm) => ({
        ...currentForm,
        title: currentForm.title || file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileDataUrl,
      }));
      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors.file;
        delete nextErrors.title;
        return nextErrors;
      });
    } catch {
      setForm(clearMaterialFileFields);
      setFileInputKey((currentKey) => currentKey + 1);
      setErrors((currentErrors) => ({
        ...currentErrors,
        file: { message: "The selected file could not be read." },
      }));
    }
  };

  const clearFile = () => {
    setForm(clearMaterialFileFields);
    setFileInputKey((currentKey) => currentKey + 1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = buildErrors(
      form,
      categoryIds,
      examIds,
      materialFolderIds,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...form,
      title: form.title.trim(),
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
          value={form.examId}
          onChange={(option) => updateField("examId", option.value)}
          error={errors.examId}
          disabled={!form.categoryId}
          placeholder="Select exam"
          searchPlaceholder="Search exams..."
          emptyText="No exams found for this category."
          helperText="Required. Exams are filtered by the selected category."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CustomDropdown
          label="Material folder"
          icon={FolderOpen}
          options={materialFolderOptions}
          value={form.materialFolderId}
          onChange={(option) =>
            updateField("materialFolderId", option.value)
          }
          error={errors.materialFolderId}
          placeholder="Select folder"
          searchPlaceholder="Search folders..."
          helperText="Choose the folder where this material should appear."
        />

        <TextInput
          label="Material name"
          name="title"
          icon={FileText}
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={errors.title}
          placeholder="Chapter 1 lecture sheet"
        />
      </div>

      <FileUpload
        key={fileInputKey}
        label="Upload PDF or image"
        name="materialFile"
        error={errors.file}
        existingUrl={form.fileDataUrl || (form.fileName ? "document" : "")}
        existingFileName={form.fileName}
        onChange={handleFileChange}
        onRemoveExisting={clearFile}
        uploadHint="PDF, JPG, PNG (Max. 2MB)"
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {secondaryAction}
        <button type="submit" className="button button-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
