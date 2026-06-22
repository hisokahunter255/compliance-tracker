import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record, loadRecords, fmt } from "@/lib/violations-store";

export const Route = createFileRoute("/violations")({
  head: () => ({
    meta: [
      { title: "تقرير المخالفات - نظام جمصة" },
      { name: "description", content: "تقرير المخالفات الجاهز للطباعة" },
    ],
  }),
  component: ViolationsReport,
});

function ViolationsReport() {
  const [records, setRecords] = useState<Record[]>([]);
  useEffect(() => { setRecords(loadRecords()); }, []);

  const totals = records.reduce(
    (acc, r) => {
      acc.trespass += r.trespass || 0;
      acc.damages += r.damages || 0;
      acc.waste += r.waste || 0;
      acc.constructionWater += r.constructionWater || 0;
      acc.insurance += r.insurance || 0;
      acc.networkConnection += r.networkConnection || 0;
      acc.tax += r.tax || 0;
      acc.contractViolation += r.contractViolation || 0;
      acc.settlement += r.settlement || 0;
      acc.total += r.totalViolation || 0;
      return acc;
    },
    { trespass: 0, damages: 0, waste: 0, constructionWater: 0, insurance: 0, networkConnection: 0, tax: 0, contractViolation: 0, settlement: 0, total: 0 }
  );

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold">تقرير المخالفات (صفحة 3)</h1>
            <p className="text-sm text-muted-foreground mt-1">جاهز للطباعة - أفقي A4</p>
          </div>
          <div className="flex gap-2">
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/inputs" className="btn-secondary">تقرير الإدخالات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
          </div>
        </div>

        <div className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">المخالفات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="report-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>المنطقة</th>
                  <th>الفرع</th>
                  <th>الاشتراك</th>
                  <th>رقم اللجنة</th>
                  <th>اسم المخالف</th>
                  <th>نوع المخالفة</th>
                  <th>توصيف الوحدة</th>
                  <th>النشاط</th>
                  <th>تعدي</th>
                  <th>تلفيات</th>
                  <th>إهدار</th>
                  <th>مياه إنشاءات</th>
                  <th>تأمين</th>
                  <th>ربط شبكات</th>
                  <th>ضريبة</th>
                  <th>مخ. ش تعاقد</th>
                  <th>شهور</th>
                  <th>الاستهلاك</th>
                  <th>تصالح</th>
                  <th>إجمالي</th>
                  <th>التاريخ</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.region}</td>
                    <td>{r.branch}</td>
                    <td>{r.subscription}</td>
                    <td>{r.committeeNo}</td>
                    <td>{r.violatorName}</td>
                    <td>{r.violationType}</td>
                    <td>{r.unitDescription}</td>
                    <td>{r.activity}</td>
                    <td>{fmt(r.trespass)}</td>
                    <td>{fmt(r.damages)}</td>
                    <td>{fmt(r.waste)}</td>
                    <td>{fmt(r.constructionWater)}</td>
                    <td>{fmt(r.insurance)}</td>
                    <td>{fmt(r.networkConnection)}</td>
                    <td>{fmt(r.tax)}</td>
                    <td>{fmt(r.contractViolation)}</td>
                    <td>{r.consumptionMonths}</td>
                    <td>{r.consumption}</td>
                    <td>{fmt(r.settlement)}</td>
                    <td><strong>{fmt(r.totalViolation)}</strong></td>
                    <td>{r.date}</td>
                    <td>{r.notes}</td>
                  </tr>
                ))}
                {records.length > 0 && (
                  <tr style={{ background: "oklch(0.92 0.04 215)", fontWeight: 700 }}>
                    <td colSpan={9}>الإجمالي</td>
                    <td>{fmt(totals.trespass)}</td>
                    <td>{fmt(totals.damages)}</td>
                    <td>{fmt(totals.waste)}</td>
                    <td>{fmt(totals.constructionWater)}</td>
                    <td>{fmt(totals.insurance)}</td>
                    <td>{fmt(totals.networkConnection)}</td>
                    <td>{fmt(totals.tax)}</td>
                    <td>{fmt(totals.contractViolation)}</td>
                    <td colSpan={2}></td>
                    <td>{fmt(totals.settlement)}</td>
                    <td>{fmt(totals.total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
