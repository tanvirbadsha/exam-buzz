"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3 sm:flex-row">
      <div className="text-xs text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-foreground">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="font-semibold text-foreground">{totalItems}</span>{" "}
        entries
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="icon-button h-8 w-8 border border-border"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-xs font-medium text-muted"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              type="button"
              key={page}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`Page ${page}`}
              onClick={() => onPageChange(page)}
              className={`h-8 min-w-8 rounded-md border px-2 text-xs font-semibold transition-colors
                ${
                  isCurrent
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-border bg-surface text-muted hover:bg-surface-muted"
                }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="icon-button h-8 w-8 border border-border"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
