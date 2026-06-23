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
import { HierarchicalCategoryDropdown } from "@/features/categories/HierarchicalCategoryDropdown";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import { useMaterialManagement } from "@/hooks/useMaterialManagement";
import { useSubjectManagement } from "@/hooks/useSubjectManagement";
import {
  ALL_MATERIAL_CATEGORY_VALUE,
  ALL_MATERIAL_EXAM_VALUE,
  MATERIAL_EXAM_FILTER_OPTIONS,
  formatMaterialCreatedAt,
  formatMaterialFileSize,
  getMaterialExamLabel,
  getMaterialFileKind,
} from "@/lib/materialData";
import {
  Download,
  FileImage,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MaterialModal } from "./MaterialModal";

function sortByName(items) {
  return [...items].sort((firstItem, secondItem) =>
    firstItem.name.localeCompare(secondItem.name),
  );
}

function buildCategoryOptions(childrenMap, includeAllOption = false) {
  const options = includeAllOption
    ? [
        {
          label: "All categories",
          value: ALL_MATERIAL_CATEGORY_VALUE,
          depth: 0,
          meta: "All categories",
          searchText: "all categories",
        },
      ]
    : [];

  const walk = (parentId = "root", depth = 0, parentPath = []) => {
    const children = sortByName(childrenMap.get(parentId) || []);

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

function buildMaterialFolderOptions(subjectIndex, topics) {
  return sortByName(topics).map((topic) => {
    const subjectPath = getPath(subjectIndex.subjectsById, topic.subjectId)
      .map((subject) => subject.name)
      .join(" / ");

    return {
      label: topic.name,
      value: topic.id,
      meta: subjectPath,
      searchText: `${topic.name} ${subjectPath}`,
    };
  });
}

function MaterialActionMenu({ material, onDelete, onEdit }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${material.title}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(material);
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
              onDelete(material);
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

function MaterialThumb({ material }) {
  if (material.fileType?.startsWith("image/") && material.fileDataUrl) {
    return (
      <Image
        src={material.fileDataUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        className="h-14 w-14 rounded-lg border border-border object-cover"
      />
    );
  }

  const Icon = material.fileType?.startsWith("image/") ? FileImage : FileText;

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-brand-soft text-brand-strong">
      <Icon size={22} />
    </div>
  );
}

export function MaterialManager({
  initialCategories,
  initialMaterials,
  initialSubjects,
  initialTopics,
}) {
  const { categoryIndex } = useCategoryManagement(initialCategories);
  const { subjectIndex, topics } = useSubjectManagement(
    initialSubjects,
    initialTopics,
  );
  const { createMaterial, deleteMaterial, materials, totals, updateMaterial } =
    useMaterialManagement(initialMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    ALL_MATERIAL_CATEGORY_VALUE,
  );
  const [examFilter, setExamFilter] = useState(ALL_MATERIAL_EXAM_VALUE);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    material: null,
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
  const materialFolderOptions = useMemo(
    () => buildMaterialFolderOptions(subjectIndex, topics),
    [subjectIndex, topics],
  );
  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const filteredMaterials = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const categoryIds =
      categoryFilter === ALL_MATERIAL_CATEGORY_VALUE
        ? null
        : getDescendantIds(categoryIndex.childrenMap, categoryFilter);

    if (categoryIds) {
      categoryIds.add(categoryFilter);
    }

    return materials.filter((material) => {
      const matchesSearch =
        !query ||
        [material.id, material.title, material.fileName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory =
        !categoryIds || categoryIds.has(material.categoryId);
      const matchesExam =
        examFilter === ALL_MATERIAL_EXAM_VALUE ||
        material.examId === examFilter;

      return matchesSearch && matchesCategory && matchesExam;
    });
  }, [
    categoryFilter,
    categoryIndex.childrenMap,
    deferredSearchQuery,
    examFilter,
    materials,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter(ALL_MATERIAL_CATEGORY_VALUE);
    setExamFilter(ALL_MATERIAL_EXAM_VALUE);
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", material: null });
  };

  const openEditModal = (material) => {
    setModalState({ isOpen: true, mode: "edit", material });
  };

  const closeModal = () => {
    setModalState((currentState) => ({ ...currentState, isOpen: false }));
  };

  const handleSubmit = (materialInput) => {
    try {
      if (modalState.mode === "edit" && modalState.material) {
        const updatedMaterial = updateMaterial(
          modalState.material.id,
          materialInput,
        );

        if (updatedMaterial) {
          toast.success(`${updatedMaterial.title} updated.`);
        }
        return;
      }

      const createdMaterial = createMaterial(materialInput);
      toast.success(`${createdMaterial.title} uploaded.`);
    } catch {
      toast.error("Material could not be saved. Try a smaller file.");
    }
  };

  const handleDelete = (material) => {
    const confirmed = window.confirm(`Delete ${material.title}?`);
    if (!confirmed) return;

    const deleted = deleteMaterial(material.id);
    if (deleted) {
      toast.success(`${material.title} deleted.`);
      return;
    }

    toast.error("Material could not be deleted.");
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Study resources
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Materials
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Upload PDF and image materials, attach them to exam categories, and
            keep folder-based resources organized for students.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">Materials</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.total}
            </p>
          </div>
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">PDF</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.pdf}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Images</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {totals.image}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4 px-2">
        <div className="grid gap-2 lg:grid-cols-12 lg:items-end">
          <label className="field-group min-w-0 lg:col-span-5 xl:col-span-4">
            <span className="field-label">Search materials</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="field-input"
                placeholder="Search by ID, name, or file..."
                aria-label="Search materials"
              />
            </span>
          </label>

          <div className="min-w-0 lg:col-span-4 xl:col-span-3">
            <HierarchicalCategoryDropdown
              label="Category"
              options={categoryFilterOptions}
              value={categoryFilter}
              onChange={(option) => setCategoryFilter(option.value)}
              placeholder="All categories"
              searchPlaceholder="Search categories..."
            />
          </div>

          <div className="min-w-0 lg:col-span-3 xl:col-span-2">
            <CustomDropdown
              label="Exam"
              options={MATERIAL_EXAM_FILTER_OPTIONS}
              value={examFilter}
              onChange={(option) => setExamFilter(option.value)}
              placeholder="All exams"
              searchPlaceholder="Search exams..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end lg:col-span-12 xl:col-span-3">
            <button
              type="button"
              className="button button-secondary min-h-11 whitespace-nowrap"
              onClick={resetFilters}
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              type="button"
              className="button button-primary min-h-11 whitespace-nowrap"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Add material
            </button>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Material list
            </h2>
            <p className="text-sm text-muted">
              {filteredMaterials.length} of {materials.length} materials shown
            </p>
          </div>
        </div>

        <TableResponsive>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Material</TableTh>
                <TableTh>Category</TableTh>
                <TableTh>Exam</TableTh>
                <TableTh>Folder</TableTh>
                <TableTh>File</TableTh>
                <TableTh>Uploaded</TableTh>
                <TableTh className="text-right">Action</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => {
                  const categoryPath = getPath(
                    categoryIndex.categoriesById,
                    material.categoryId,
                  );
                  const categoryLabel =
                    categoryPath.map((category) => category.name).join(" / ") ||
                    "Unknown category";
                  const materialFolder = topicsById.get(
                    material.materialFolderId,
                  );

                  return (
                    <TableRow key={material.id}>
                      <TableTd>
                        <div className="flex min-w-80 items-center gap-3">
                          <MaterialThumb material={material} />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {material.title}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted">
                              {material.id}
                            </p>
                          </div>
                        </div>
                      </TableTd>
                      <TableTd>
                        <span className="inline-flex min-w-44 max-w-72 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-strong">
                          <span className="truncate">{categoryLabel}</span>
                        </span>
                      </TableTd>
                      <TableTd className="min-w-48 font-semibold text-foreground">
                        {getMaterialExamLabel(material.examId)}
                      </TableTd>
                      <TableTd>
                        <div className="flex min-w-44 items-center gap-2 text-sm font-semibold text-foreground">
                          <FolderOpen size={15} className="text-muted" />
                          {materialFolder?.name || "Unknown folder"}
                        </div>
                      </TableTd>
                      <TableTd>
                        <div className="min-w-48">
                          <p className="text-sm font-semibold text-foreground">
                            {getMaterialFileKind(material.fileType)} ·{" "}
                            {formatMaterialFileSize(material.fileSize)}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted">
                            {material.fileName}
                          </p>
                        </div>
                      </TableTd>
                      <TableTd className="min-w-44 text-sm font-semibold text-foreground">
                        {formatMaterialCreatedAt(material.createdAt)}
                      </TableTd>
                      <TableTd>
                        <div className="flex items-center justify-end gap-2">
                          {material.fileDataUrl ? (
                            <a
                              href={material.fileDataUrl}
                              download={material.fileName}
                              className="icon-button h-9 w-9 border border-border"
                              aria-label={`Download ${material.title}`}
                            >
                              <Download size={16} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="icon-button h-9 w-9 border border-border"
                              aria-label={`${material.title} file is not available for download`}
                              disabled
                            >
                              <Download size={16} />
                            </button>
                          )}
                          <MaterialActionMenu
                            material={material}
                            onDelete={handleDelete}
                            onEdit={openEditModal}
                          />
                        </div>
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd colSpan={7} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No materials found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or upload a new material.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <MaterialModal
        categoryIndex={categoryIndex}
        categoryOptions={categoryOptions}
        isOpen={modalState.isOpen}
        material={modalState.material}
        materialFolderOptions={materialFolderOptions}
        mode={modalState.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
