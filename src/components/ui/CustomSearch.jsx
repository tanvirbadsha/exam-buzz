"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

export default function CustomSearch({
  placeholder,
  searchQuery,
  setSearchQuery,
  ariaLabel = "Search",
  wide = false,
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${wide ? "" : "md:w-80"}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="text"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="field-shell field-input min-h-10 border border-border-strong bg-surface pl-9 pr-10 shadow-sm"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="icon-button absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
