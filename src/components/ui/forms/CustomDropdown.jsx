"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function isPrintableKey(event) {
  return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
}

export function CustomDropdown({
  label,
  icon: Icon,
  options = [],
  value,
  onChange,
  error,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  isLoading = false,
  loadingText = "Loading options...",
  emptyText = "No options found.",
  helperText,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      (option.searchText || option.label).toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  const errorId = error ? `${label.replace(/\s+/g, "-").toLowerCase()}-error` : undefined;

  const openDropdown = () => {
    if (disabled) return;
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  const selectOption = (option) => {
    onChange(option);
    closeDropdown();
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

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
        Math.min(index + 1, filteredOptions.length - 1),
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
      const option =
        filteredOptions[Math.min(highlightedIndex, filteredOptions.length - 1)];

      if (option) {
        selectOption(option);
      }
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
        aria-describedby={errorId}
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`field-shell w-full px-3 text-left ${
          error ? "field-shell-error" : ""
        } ${disabled ? "cursor-not-allowed bg-surface-muted opacity-70" : ""}`}
      >
        {Icon && (
          <Icon
            size={16}
            className={`${error ? "text-rose-400" : "text-muted"} mr-2.5 shrink-0`}
          />
        )}
        <span
          className={`field-input flex-1 truncate ${
            selectedOption ? "" : "text-[#94a39a]"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
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

          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted">{loadingText}</div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    type="button"
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectOption(option);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      isHighlighted ? "bg-brand-soft text-brand-strong" : ""
                    } ${isSelected ? "font-semibold text-brand-strong" : "text-foreground"}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.meta && (
                      <span className="ml-3 shrink-0 text-xs text-muted">
                        {option.meta}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted">{emptyText}</div>
            )}
          </div>
        </div>
      )}

      {helperText && !error && <span className="text-xs text-muted">{helperText}</span>}
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error.message}
        </span>
      )}
    </div>
  );
}
