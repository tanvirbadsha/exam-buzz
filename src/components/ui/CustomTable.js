"use client";

export function TableContainer({ children }) {
  return <div className="surface-card overflow-hidden">{children}</div>;
}

export function TableResponsive({ children }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Table({ children }) {
  return <table className="w-full text-left border-collapse">{children}</table>;
}

export function TableHead({ children }) {
  return (
    <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-muted">
      {children}
    </thead>
  );
}

export function TableTh({ children, className = "" }) {
  return <th className={`py-3 px-5 ${className}`}>{children}</th>;
}

export function TableBody({ children }) {
  return (
    <tbody className="divide-y divide-border text-sm text-slate-700">
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }) {
  return (
    <tr className={`transition-colors hover:bg-surface-muted ${className}`}>
      {children}
    </tr>
  );
}

export function TableTd({ children, className = "", ...props }) {
  return (
    <td className={`py-3.5 px-5 ${className}`} {...props}>
      {children}
    </td>
  );
}
