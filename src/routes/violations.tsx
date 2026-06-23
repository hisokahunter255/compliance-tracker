import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record, loadRecords, fmt } from "@/lib/violations-store";
import { exportElementToPdf, exportTableToExcel } from "@/lib/export-utils";

type Search = { from?: number; to?: number };

export const Route = createFileRoute("/violations")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    from: s.from ? Number(s.from) : undefined,
    to: s.to ? Number(s.to) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تقرير المخالفات - نظام جمصة" },
      { name: "description", content: "تقرير المخالفات الجاهز للطباعة" },
    ],
  }),
  component: ViolationsReport,
});

function ViolationsReport() {
  const { from, to } = Route.useSearch();
  const [all, setAll] = useState<Record[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  useEffect(() => { setAll(loadRecords()); }, []);

  const records = useMemo(() => {
    const f = from && from > 0 ? from - 1 : 0;
    const t = to && to > 0 ? to : all.length;
    return all.slice(f, t);
  }, [all, from, to]);

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

  const startNo = (from && from > 0 ? from : 1);

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold">تقرير المخالفات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {from || to ? `النطاق: ${startNo} - ${startNo + records.length - 1}` : "كل السجلات"} ({records.length})
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/inputs" search={{ from, to } as any} className="btn-secondary">تقرير الإدخالات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
            <button className="btn-success" onClick={() => tableRef.current && exportTableToExcel(tableRef.current, "تقرير_المخالفات", "المخالفات")}>📊 Excel</button>
            <button className="btn-success" onClick={() => pageRef.current && exportElementToPdf(pageRef.current, "تقرير_المخالفات", "landscape")}>📄 PDF</button>
          </div>
        </div>

        <div ref={pageRef} className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">المخالفات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table ref={tableRef} className="report-table">
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
                    <td>{startNo + i}</td>
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
