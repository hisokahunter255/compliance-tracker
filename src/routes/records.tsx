import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record, loadRecords, deleteRecord, fmt } from "@/lib/violations-store";

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
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => { setRecords(loadRecords()); }, []);

  const refresh = () => setRecords(loadRecords());

  const handleDelete = (id: string) => {
    if (!confirm("هل تريد حذف هذه المخالفة؟")) return;
    deleteRecord(id);
    refresh();
  };

  const handleDistribute = () => {
    if (records.length === 0) {
      alert("لا توجد بيانات للتوزيع");
      return;
    }
    router.navigate({ to: "/violations" });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">سجلات المخالفات ({records.length})</h1>
            <p className="text-sm text-muted-foreground mt-1">
              جميع المخالفات المدخلة، اضغط زر التوزيع لإصدار التقارير
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary">+ إدخال جديد</Link>
            <button onClick={handleDistribute} className="btn-success">زر التوزيع ←</button>
          </div>
        </div>

        {records.length === 0 ? (
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
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
