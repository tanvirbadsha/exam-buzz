"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Search,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIEWPORT_GAP = 8;
const DROPDOWN_MAX_HEIGHT = 288;
const INDENT_WIDTH = 24;
const ROOT_PARENT_VALUE = "__root__";

function isPrintableKey(event) {
  return (
    event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCompactPath(option) {
  const pathParts = String(option?.meta || option?.label || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (pathParts.length === 0) return "";

  return pathParts.slice(-3).join(" / ");
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

function getAncestorValues(nodesByValue, value) {
  const ancestors = [];
  let currentNode = nodesByValue.get(value);

  while (currentNode?.parentValue) {
    ancestors.unshift(currentNode.parentValue);
    currentNode = nodesByValue.get(currentNode.parentValue);
  }

  return ancestors;
}

function collectDescendantValues(node, descendantValues = new Set()) {
  node.children.forEach((childNode) => {
    descendantValues.add(childNode.value);
    collectDescendantValues(childNode, descendantValues);
  });

  return descendantValues;
}

function getSiblingValues(nodesByValue, targetNode) {
  const siblings = targetNode.parentValue
    ? nodesByValue.get(targetNode.parentValue)?.children || []
    : Array.from(nodesByValue.values()).filter((node) => !node.parentValue);

  return siblings
    .filter((node) => node.value !== targetNode.value)
    .map((node) => node.value);
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

export function HierarchicalCategoryDropdown({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select category",
  searchPlaceholder = "Search categories...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [expandedValues, setExpandedValues] = useState(() => new Set());
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const { rootNodes, nodesByValue } = useMemo(
    () => buildOptionTree(options),
    [options],
  );
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );
  const selectedAncestorValues = useMemo(
    () => getAncestorValues(nodesByValue, value),
    [nodesByValue, value],
  );
  const hasSelectedParent =
    selectedOption && selectedOption.value !== ROOT_PARENT_VALUE;
  const selectedLabel = hasSelectedParent ? getCompactPath(selectedOption) : "";

  const visibleOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return flattenVisibleNodes(rootNodes, expandedValues);

    return options
      .map((option) => nodesByValue.get(option.value) || option)
      .filter((option) =>
        (option.searchText || `${option.label} ${option.meta || ""}`)
          .toLowerCase()
          .includes(query),
      );
  }, [expandedValues, nodesByValue, options, rootNodes, searchQuery]);
  const activeHighlightedIndex = Math.min(
    highlightedIndex,
    Math.max(visibleOptions.length - 1, 0),
  );

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
        getSiblingValues(nodesByValue, option).forEach((siblingValue) => {
          const siblingNode = nodesByValue.get(siblingValue);
          nextValues.delete(siblingValue);
          if (siblingNode) {
            collectDescendantValues(siblingNode).forEach((descendantValue) =>
              nextValues.delete(descendantValue),
            );
          }
        });
        nextValues.add(option.value);
      }
      return nextValues;
    });
  };

  const updateMenuPosition = useCallback(() => {
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
  }, []);

  const openDropdown = () => {
    setHighlightedIndex(0);
    setExpandedValues(new Set(selectedAncestorValues));
    updateMenuPosition();
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
    setExpandedValues(new Set());
  };

  const selectOption = (option) => {
    onChange(option);
    closeDropdown();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeDropdown();
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
  }, [isOpen, updateMenuPosition]);

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (isPrintableKey(event)) {
      event.preventDefault();
      setSearchQuery(event.key);
      setHighlightedIndex(0);
      openDropdown();
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        Math.min(index + 1, visibleOptions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = visibleOptions[activeHighlightedIndex];

      if (option) {
        selectOption(option);
      }
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const option = visibleOptions[activeHighlightedIndex];
      if (option?.children?.length && !expandedValues.has(option.value)) {
        toggleOptionExpansion(option);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const option = visibleOptions[activeHighlightedIndex];
      if (!option?.children?.length) return;

      setExpandedValues((currentValues) => {
        const nextValues = new Set(currentValues);
        nextValues.delete(option.value);
        return nextValues;
      });
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div ref={wrapperRef} className="field-group relative">
      {label && <label className="field-label">{label}</label>}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className="field-shell w-full px-3 text-left"
      >
        <FolderTree size={16} className="mr-2.5 shrink-0 text-muted" />
        <span
          className={`field-input flex-1 truncate ${
            hasSelectedParent ? "" : "text-[#94a39a]"
          }`}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

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
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
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
                  const isSelected = option.value === value;
                  const isHighlighted = index === activeHighlightedIndex;
                  const depth = Math.max(0, Number(option.depth) || 0);
                  const hasChildren = option.children?.length > 0;
                  const isExpanded = expandedValues.has(option.value);

                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => {
                        setHighlightedIndex(index);
                      }}
                      className={`flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition-colors ${
                        isHighlighted ? "bg-brand-soft text-brand-strong" : ""
                      } ${
                        isSelected
                          ? "font-semibold text-brand-strong"
                          : "text-foreground"
                      }`}
                      style={{ paddingLeft: `${12 + depth * INDENT_WIDTH}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-white hover:text-brand-strong"
                          aria-label={`${isExpanded ? "Hide" : "Show"} sub-categories for ${option.label}`}
                          aria-expanded={isExpanded}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleOptionExpansion(option);
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
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectOption(option);
                        }}
                      >
                        {option.label}
                      </button>
                      {isSelected && <Check size={15} className="shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted">
                  No categories found.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
