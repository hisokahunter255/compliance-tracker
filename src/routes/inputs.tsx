import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record as ViolationRecord, loadRecords } from "@/lib/violations-store";
import { exportElementToPdf, exportTableToExcel } from "@/lib/export-utils";

type Search = { from?: number; to?: number };

export const Route = createFileRoute("/inputs")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    from: s.from ? Number(s.from) : undefined,
    to: s.to ? Number(s.to) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تقرير الإدخالات - نظام جمصة" },
      { name: "description", content: "تقرير إدخالات العدادات والاشتراكات جاهز للطباعة" },
    ],
  }),
  component: InputsReport,
});

function InputsReport() {
  const { from, to } = Route.useSearch();
  const [all, setAll] = useState<ViolationRecord[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  useEffect(() => { setAll(loadRecords()); }, []);

  const records = useMemo(() => {
    const f = from && from > 0 ? from - 1 : 0;
    const t = to && to > 0 ? to : all.length;
    return all.slice(f, t);
  }, [all, from, to]);

  const startNo = (from && from > 0 ? from : 1);

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold">تقرير الإدخالات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {from || to ? `النطاق: ${startNo} - ${startNo + records.length - 1}` : "كل السجلات"} ({records.length})
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/violations" search={{ from, to } as any} className="btn-secondary">تقرير المخالفات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
            <button className="btn-success" onClick={() => tableRef.current && exportTableToExcel(tableRef.current, "تقرير_الإدخالات", "الإدخالات")}>📊 Excel</button>
            <button className="btn-success" onClick={() => pageRef.current && exportElementToPdf(pageRef.current, "تقرير_الإدخالات", "landscape")}>📄 PDF</button>
          </div>
        </div>

        <div ref={pageRef} className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">الإدخالات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table ref={tableRef} className="report-table">
              <thead>
                <tr>
                  <th rowSpan={2}>م</th>
                  <th rowSpan={2}>رقم الحساب</th>
                  <th rowSpan={2}>اسم المشترك</th>
                  <th rowSpan={2}>العنوان</th>
                  <th rowSpan={2}>رقم البطاقة</th>
                  <th rowSpan={2}>نوع الحساب</th>
                  <th colSpan={3}>بيانات العداد</th>
                  <th rowSpan={2}>الصرف الصحي</th>
                  <th rowSpan={2}>تاريخ الفتح والتركيب</th>
                  <th rowSpan={2}>رقم القسيمة</th>
                </tr>
                <tr>
                  <th>قطر</th>
                  <th>ماركة</th>
                  <th>شاسيه</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{startNo + i}</td>
                    <td>{r.subscription}</td>
                    <td>{r.violatorName}</td>
                    <td>{r.address}</td>
                    <td>{r.cardNumber}</td>
                    <td>{r.activity}</td>
                    <td>{r.meterDiameter}</td>
                    <td>{r.meterBrand}</td>
                    <td>{r.meterPrepaid}</td>
                    <td>{r.sewage}</td>
                    <td>{r.installDate}</td>
                    <td>{r.voucherNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-16 flex items-end justify-between gap-8 text-sm font-semibold">
            <div className="text-center flex-1">
              <div className="border-t-2 border-foreground pt-2 mx-4">مسئول الإدخالات</div>
            </div>
            <div className="text-center flex-1">
              <div className="border-t-2 border-foreground pt-2 mx-4">مدير شئون مشتركين</div>
            </div>
            <div className="text-center flex-1">
              <div className="border-t-2 border-foreground pt-2 mx-4">مدير مركز خدمة العملاء</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
