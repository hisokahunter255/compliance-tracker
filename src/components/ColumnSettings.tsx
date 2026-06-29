import { useState } from "react";

export interface ColumnDef {
  key: string;
  label: string;
}

export function ColumnSettings({
  columns,
  hidden,
  onChange,
}: {
  columns: ColumnDef[];
  hidden: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };
  return (
    <div className="relative">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((v) => !v)}
        title="إعدادات الأعمدة"
      >
        ⚙ الأعمدة ({columns.length - hidden.size}/{columns.length})
      </button>
      {open && (
        <div
          className="absolute end-0 mt-2 z-20 bg-card border border-border rounded-lg shadow-lg p-3 w-72 max-h-96 overflow-auto"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <strong className="text-sm">إظهار / إخفاء الأعمدة</strong>
            <button type="button" className="text-xs underline" onClick={() => onChange(new Set())}>
              عرض الكل
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {columns.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm hover:bg-muted/50 rounded px-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!hidden.has(c.key)}
                  onChange={() => toggle(c.key)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
