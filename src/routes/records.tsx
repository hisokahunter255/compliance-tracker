import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record as ViolationRecord, loadRecords, deleteRecord, fmt } from "@/lib/violations-store";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "سجل المخالفات - نظام جمصة" },
      { name: "description", content: "عرض جميع المخالفات المحفوظة وتوزيعها على التقارير" },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ViolationRecord[]>([]);
  const [fromNo, setFromNo] = useState<string>("");
  const [toNo, setToNo] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  const refresh = () => { loadRecords().then(setRecords); };
  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذه المخالفة؟")) return;
    await deleteRecord(id);
    refresh();
  };

  const total = records.length;
  const range = useMemo(() => {
    const f = Math.max(1, parseInt(fromNo || "1", 10) || 1);
    const t = Math.min(total, parseInt(toNo || String(total), 10) || total);
    return { from: f, to: Math.max(f, t) };
  }, [fromNo, toNo, total]);

  const navigateWithRange = (to: "/violations" | "/inputs") => {
    if (total === 0) { alert("لا توجد بيانات للتوزيع"); return; }
    router.navigate({ to, search: { from: range.from, to: range.to } as any });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">سجلات المخالفات ({total})</h1>
            <p className="text-sm text-muted-foreground mt-1">
              حدد نطاق المسلسل ثم اضغط زر التوزيع لإصدار التقارير
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary">+ إدخال جديد</Link>
          </div>
        </div>

        {total > 0 && (
          <div className="section-card mb-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">من مسلسل</label>
              <input
                type="number" min={1} max={total}
                value={fromNo} placeholder="1"
                onChange={(e) => setFromNo(e.target.value)}
                className="field-input w-28"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">إلى مسلسل</label>
              <input
                type="number" min={1} max={total}
                value={toNo} placeholder={String(total)}
                onChange={(e) => setToNo(e.target.value)}
                className="field-input w-28"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              النطاق المختار: <strong>{range.from}</strong> إلى <strong>{range.to}</strong> ({range.to - range.from + 1} سجل)
            </div>
            <div className="flex gap-2 ms-auto">
              <button onClick={() => navigateWithRange("/violations")} className="btn-success">
                توزيع المخالفات ←
              </button>
              <button onClick={() => navigateWithRange("/inputs")} className="btn-success">
                توزيع الإدخالات ←
              </button>
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="mb-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 بحث في الاسم، الاشتراك، الفرع، نوع المخالفة، البطاقة..."
              className="field-input w-full max-w-xl"
            />
          </div>
        )}

        {total === 0 ? (
          <div className="section-card text-center py-16">
            <p className="text-muted-foreground mb-4">لا توجد سجلات حتى الآن</p>
            <Link to="/" className="btn-primary inline-block">ابدأ بإدخال أول مخالفة</Link>
          </div>
        ) : (
          <div className="section-card overflow-x-auto">
            <table className="report-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>الفرع</th>
                  <th>اسم المخالف</th>
                  <th>الاشتراك</th>
                  <th>رقم اللجنة</th>
                  <th>نوع المخالفة</th>
                  <th>النشاط</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const n = i + 1;
                  const inRange = n >= range.from && n <= range.to;
                  const q = query.trim().toLowerCase();
                  if (q && ![r.violatorName, r.subscription, r.branch, r.violationType, r.activity, r.cardNumber, r.committeeNo]
                    .some((v) => (v || "").toString().toLowerCase().includes(q))) return null;
                  return (
                    <tr key={r.id} style={inRange ? { background: "oklch(0.96 0.04 215)" } : undefined}>
                      <td>{n}</td>
                      <td>{r.branch}</td>
                      <td>{r.violatorName}</td>
                      <td>{r.subscription}</td>
                      <td>{r.committeeNo}</td>
                      <td>{r.violationType}</td>
                      <td>{r.activity}</td>
                      <td><strong>{fmt(r.totalViolation)}</strong></td>
                      <td>{r.date}</td>
                      <td>
                        <button onClick={() => handleDelete(r.id)} className="btn-danger">حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
