export function PermissionTags({ permissions = [] }) {
  if (permissions.length === 0) {
    return <span className="text-sm font-medium text-muted">No permission</span>;
  }

  return (
    <div className="flex max-w-[22rem] flex-wrap gap-1.5">
      {permissions.map((permission) => (
        <span
          key={permission}
          className="rounded-full border border-brand-soft bg-brand-soft px-2.5 py-1 text-[11px] font-bold leading-none text-brand-strong"
        >
          {permission}
        </span>
      ))}
    </div>
  );
}
