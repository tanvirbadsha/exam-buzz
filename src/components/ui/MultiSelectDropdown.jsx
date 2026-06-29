"use client";

import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_GAP = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

export default function MultiSelectDropdown({
  emptyText = "No options available.",
  error,
  helperText,
  icon: Icon,
  label,
  onChange,
  options = [], // Added default value to protect loops
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  value = [], // Added default value
  dropdownMaxHeight = 288, // FIX 3: JavaScript parameters should use camelCase
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: dropdownMaxHeight,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedValues, setExpandedValues] = useState(() => new Set());

  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const selectedValues = useMemo(() => new Set(value.map(String)), [value]);

  const { rootNodes, nodesByValue } = useMemo(
    () => buildOptionTree(options),
    [options],
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(String(option.value))),
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
      Math.min(dropdownMaxHeight, availableHeight),
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
    const stringVal = String(optionValue);
    if (nextValues.has(stringVal)) {
      nextValues.delete(stringVal);
    } else {
      nextValues.add(stringVal);
    }
    onChange(Array.from(nextValues));
  };

  const removeValue = (optionValue) => {
    onChange(
      value.filter(
        (currentValue) => String(currentValue) !== String(optionValue),
      ),
    );
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
    <div
      ref={wrapperRef}
      className="field-group relative flex flex-col gap-1.5"
    >
      {label && <span className="field-label">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className={`field-shell min-h-11 w-full px-3 text-left flex items-center ${
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
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selectedOptions.map((option, index) => (
            <span
              key={`selected-${option.value}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs font-bold text-brand-strong"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeValue(option.value);
                }}
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
            <div className="flex items-center border-b border-border px-3 bg-white">
              <Search size={15} className="mr-2 shrink-0 text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="field-input min-h-10 w-full outline-none text-sm"
              />
            </div>

            <div
              className="overflow-y-auto py-1 bg-white"
              style={{ maxHeight: `${menuPosition.maxHeight}px` }}
              role="listbox"
            >
              {visibleOptions.length > 0 ? (
                visibleOptions.map((option, index) => {
                  const checked = selectedValues.has(String(option.value));
                  const depth = Math.max(0, Number(option.depth) || 0);
                  const node = nodesByValue.get(option.value) || option;
                  const hasChildren = node.children?.length > 0;
                  const isExpanded = expandedValues.has(option.value);

                  return (
                    <div
                      key={`option-${option.value}-${index}`}
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggleValue(option.value)}
                      className={`flex min-h-10 items-center gap-2 py-2 pr-3 text-sm transition-colors hover:bg-brand-soft cursor-pointer ${
                        checked
                          ? "font-semibold text-brand-strong bg-brand-soft/40"
                          : "text-foreground"
                      }`}
                      style={{ paddingLeft: `${12 + depth * 24}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-gray-200 hover:text-brand-strong"
                          aria-label={`${isExpanded ? "Hide" : "Show"} nested options for ${option.label}`}
                          aria-expanded={isExpanded}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation(); // Stop row toggle event
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
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-border text-brand focus:ring-0 pointer-events-none"
                        style={{ accentColor: "var(--color-brand)" }}
                      />
                      <span className="min-w-0 flex-1 truncate select-none">
                        {option.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-sm text-muted">{emptyText} </p>
              )}
            </div>
          </div>,
          document.body,
        )}

      {helperText && !error && (
        <span className="text-xs text-muted">{helperText}</span>
      )}
      {error && (
        <span className="field-error text-xs text-red-500 mt-1" role="alert">
          {error.message}
        </span>
      )}
    </div>
  );
}
