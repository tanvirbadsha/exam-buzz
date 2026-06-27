"use client";

import {
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useFolderManagement } from "@/hooks/useFolderManagement";
import { FolderModal } from "./FolderModal";

function FolderActionMenu({ folder, onView, onEdit, onDelete }) {
  return (
    <FloatingActionMenu ariaLabel={`Open actions for ${folder.name}`}>
      {({ closeMenu }) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onView(folder);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            View
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onEdit(folder);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onDelete(folder);
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

export function FolderManager({ initialFolders = DEFAULT_FOLDERS }) {
  const { createFolder, deleteFolder, folders, themeTotals, toggleActive, updateFolder } =
    useFolderManagement(initialFolders);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const foldersById = useMemo(() => {
    const map = new Map();
    folders.forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const childrenMap = useMemo(() => {
    const map = new Map();
    folders.forEach((folder) => {
      const key = folder.parentId || "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(folder);
    });
    return map;
  }, [folders]);

  const directChildCounts = useMemo(() => {
    const counts = new Map();
    folders.forEach((folder) => {
      counts.set(folder.id, (childrenMap.get(folder.id) || []).length);
    });
    return counts;
  }, [folders, childrenMap]);

  const selectedFolder =
    selectedParentId && foldersById.has(selectedParentId)
      ? foldersById.get(selectedParentId)
      : null;
  const currentParentKey = selectedFolder?.id || "root";
  const currentChildren = useMemo(
    () => (childrenMap.get(currentParentKey) || []).slice().sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    [currentParentKey, childrenMap],
  );
  const breadcrumbFolders = useMemo(() => {
    if (!selectedFolder) return [];
    const path = [];
    let current = selectedFolder;
    while (current) {
      path.unshift(current);
      current = current.parentId ? foldersById.get(current.parentId) || null : null;
    }
    return path;
  }, [selectedFolder, foldersById]);

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create",
    folder: null,
  });

  const statusFilterOptions = useMemo(
    () => [
      { label: "All", value: "all" },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
    [],
  );

  const filteredFolders = useMemo(() => {
    const query = deferredSearchQuery;
    return currentChildren.filter((folder) => {
      const matchesSearch =
        !query ||
        [folder.id, folder.name].join(" ").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || folder.isActive === (statusFilter === "active");
      return matchesSearch && matchesStatus;
    });
  }, [deferredSearchQuery, currentChildren, statusFilter]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
  }, []);

  const drillIntoFolder = (folder) => {
    setSelectedParentId(folder.id);
    resetFilters();
  };

  const goBack = () => {
    if (selectedFolder?.parentId) {
      setSelectedParentId(selectedFolder.parentId);
    } else {
      setSelectedParentId(null);
    }
    resetFilters();
  };

  const goToRoot = () => {
    setSelectedParentId(null);
    resetFilters();
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", folder: null });
  };

  const openEditModal = (folder) => {
    setModalState({ isOpen: true, mode: "edit", folder });
  };

  const openViewModal = (folder) => {
    setModalState({ isOpen: true, mode: "view", folder });
  };

  const closeModal = () => {
    setModalState((current) => ({ ...current, isOpen: false }));
  };

  const handleSubmit = (folderInput) => {
    if (modalState.mode === "edit" && modalState.folder) {
      const updated = updateFolder(modalState.folder.id, folderInput);
      if (updated) {
        toast.success(`${updated.name} updated.`);
      }
      return;
    }
    const created = createFolder(folderInput);
    toast.success(`${created.name} created.`);
  };

  const handleDelete = (folder) => {
    const confirmed = window.confirm(`Delete "${folder.name}"?`);
    if (!confirmed) return;
    const deleted = deleteFolder(folder.id);
    if (deleted) {
      toast.success(`${folder.name} deleted.`);
      return;
    }
    toast.error("Folder could not be deleted.");
  };

  const handleStatusToggle = (folder) => {
    const updated = toggleActive(folder.id);
    if (updated) {
      toast.success(
        `${updated.name} marked as ${updated.isActive ? "active" : "inactive"}.`,
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-strong">
            Content organization
          </p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
            Folders
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Create and manage folders to keep study materials organized. Set
            parent folders to build a hierarchical structure.
          </p>
        </div>

        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-r border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted">All folders</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {folders.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">
              {themeTotals.total}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4 px-2">
        <div className="grid gap-2 lg:grid-cols-12 lg:items-end">
          <label className="field-group min-w-0 lg:col-span-5 xl:col-span-4">
            <span className="field-label">Search folders</span>
            <span className="field-shell px-3">
              <Search size={16} className="mr-2.5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input"
                placeholder="Search by name or parent..."
                aria-label="Search folders"
              />
            </span>
          </label>

          <div className="min-w-0 lg:col-span-3 xl:col-span-2">
            <CustomDropdown
              label="Status"
              options={statusFilterOptions}
              value={statusFilterOptions.find((o) => o.value === statusFilter)}
              onChange={(option) => setStatusFilter(option.value)}
              placeholder="All status"
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
              Add folder
            </button>
          </div>
        </div>
      </section>

      <TableContainer>
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            {selectedFolder ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-brand-strong transition-colors hover:bg-brand-soft"
                  onClick={goToRoot}
                >
                  Folders
                </button>
                {breadcrumbFolders.map((folder) => (
                  <span
                    key={folder.id}
                    className="inline-flex min-w-0 items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-border-strong" />
                    <button
                      type="button"
                      className={`max-w-44 truncate rounded-md px-2 py-1 transition-colors ${
                        folder.id === selectedFolder?.id
                          ? "bg-brand-soft text-brand-strong"
                          : "text-brand-strong hover:bg-brand-soft"
                      }`}
                      onClick={() => setSelectedParentId(folder.id)}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <h2 className="text-base font-semibold text-foreground">
                Folders
              </h2>
            )}
            {selectedFolder && <h2 className="sr-only">{selectedFolder.name}</h2>}
            <p className="text-sm text-muted">
              {filteredFolders.length} of {currentChildren.length} sub-folders
              {selectedFolder ? "" : " at root level"} shown
            </p>
          </div>

          {selectedFolder && (
            <button
              type="button"
              className="button button-secondary"
              onClick={goBack}
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
                <TableTh>Folder name</TableTh>
                <TableTh>Sub-folders</TableTh>
                <TableTh>Status</TableTh>
                <TableTh className="text-right">Actions</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredFolders.length > 0 ? (
                filteredFolders.map((folder) => {
                  const childCount = directChildCounts.get(folder.id) || 0;
                  return (
                    <TableRow key={folder.id}>
                      <TableTd>
                        <span className="font-semibold text-foreground">
                          {folder.name}
                        </span>
                      </TableTd>
                      <TableTd>
                        {childCount > 0 ? (
                          <button
                            type="button"
                            className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-brand-soft bg-brand-soft px-3 text-sm font-black text-brand-strong transition-colors hover:border-brand hover:bg-white"
                            onClick={() => drillIntoFolder(folder)}
                            aria-label={`Show ${childCount} sub-folders of ${folder.name}`}
                          >
                            {childCount}
                          </button>
                        ) : (
                          <span className="inline-flex min-h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-surface-muted px-3 text-sm font-bold text-muted">
                            0
                          </span>
                        )}
                      </TableTd>
                      <TableTd>
                        <div className="flex w-max items-center gap-2">
                          <StatusToggle
                            checked={folder.isActive}
                            onChange={() => handleStatusToggle(folder)}
                            label={folder.isActive ? "Active" : "Inactive"}
                          />
                          <span className="text-xs font-semibold text-muted">
                            {folder.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableTd>
                      <TableTd>
                        <div className="flex items-center justify-end">
                          <FolderActionMenu
                            folder={folder}
                            onView={openViewModal}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                          />
                        </div>
                      </TableTd>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableTd colSpan={4} className="py-12 text-center">
                    <p className="font-semibold text-foreground">
                      No folders found
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Adjust the filters or create a new folder.
                    </p>
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableResponsive>
      </TableContainer>

      <FolderModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        folder={modalState.folder}
        folders={folders}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
