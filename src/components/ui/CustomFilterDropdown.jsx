"use client";

export function CustomFilterDropdown({
  icon: Icon,
  value,
  onChange,
  options = [],
  label = "Filter options",
}) {
  return (
    <div className="field-shell min-h-10 gap-1.5 bg-surface-muted px-2.5">
      {Icon && <Icon size={14} className="shrink-0 text-muted" />}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer bg-transparent pr-1 text-xs font-semibold text-muted outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
