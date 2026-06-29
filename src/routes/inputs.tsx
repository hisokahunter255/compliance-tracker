import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record as ViolationRecord, loadRecords, loadHiddenColumns, saveHiddenColumns } from "@/lib/violations-store";
import { exportElementToPdf, exportTableToExcel } from "@/lib/export-utils";
import { ColumnSettings, type ColumnDef } from "@/components/ColumnSettings";

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

const REPORT_ID = "inputs";

const COLUMNS: ColumnDef[] = [
  { key: "no", label: "م" },
  { key: "subscription", label: "رقم الحساب" },
  { key: "violatorName", label: "اسم المشترك" },
  { key: "address", label: "العنوان" },
  { key: "cardNumber", label: "رقم البطاقة" },
  { key: "activity", label: "نوع الحساب" },
  { key: "meterDiameter", label: "قطر العداد" },
  { key: "meterBrand", label: "ماركة العداد" },
  { key: "meterPrepaid", label: "شاسيه/نوع العداد" },
  { key: "sewage", label: "الصرف الصحي" },
  { key: "installDate", label: "تاريخ الفتح والتركيب" },
  { key: "voucherNumber", label: "رقم القسيمة" },
];

function cellValue(r: ViolationRecord, key: string, no: number): React.ReactNode {
  switch (key) {
    case "no": return no;
    case "subscription": return r.subscription;
    case "violatorName": return r.violatorName;
    case "address": return r.address;
    case "cardNumber": return r.cardNumber;
    case "activity": return r.activity;
    case "meterDiameter": return r.meterDiameter;
    case "meterBrand": return r.meterBrand;
    case "meterPrepaid": return r.meterPrepaid;
    case "sewage": return r.sewage;
    case "installDate": return r.installDate;
    case "voucherNumber": return r.voucherNumber;
  }
  return "";
}

function InputsReport() {
  const { from, to } = Route.useSearch();
  const [all, setAll] = useState<ViolationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pageRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  useEffect(() => {
    setAll(loadRecords());
    setHidden(loadHiddenColumns(REPORT_ID));
  }, []);

  const onChangeHidden = (next: Set<string>) => {
    setHidden(next);
    saveHiddenColumns(REPORT_ID, next);
  };

  const ranged = useMemo(() => {
    const f = from && from > 0 ? from - 1 : 0;
    const t = to && to > 0 ? to : all.length;
    return all.slice(f, t);
  }, [all, from, to]);

  const records = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranged;
    return ranged.filter((r) =>
      [r.subscription, r.violatorName, r.address, r.cardNumber, r.activity, r.voucherNumber, r.branch]
        .some((v) => (v || "").toString().toLowerCase().includes(q))
    );
  }, [ranged, query]);

  const startNo = (from && from > 0 ? from : 1);
  const visibleCols = COLUMNS.filter((c) => !hidden.has(c.key));

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
          <div className="flex gap-2 flex-wrap items-center">
            <ColumnSettings columns={COLUMNS} hidden={hidden} onChange={onChangeHidden} />
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/violations" search={{ from, to } as any} className="btn-secondary">تقرير المخالفات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
            <button className="btn-success" onClick={() => tableRef.current && exportTableToExcel(tableRef.current, "تقرير_الإدخالات", "الإدخالات")}>📊 Excel</button>
            <button className="btn-success" onClick={() => pageRef.current && exportElementToPdf(pageRef.current, "تقرير_الإدخالات", "landscape")}>📄 PDF</button>
          </div>
        </div>

        <div className="no-print mb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 بحث في الاسم، الحساب، البطاقة، العنوان، القسيمة..."
            className="field-input w-full max-w-xl"
          />
        </div>

        <div ref={pageRef} className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">الإدخالات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table ref={tableRef} className="report-table">
              <thead>
                {(() => {
                  const meterKeys = ["meterDiameter", "meterBrand", "meterPrepaid"];
                  const visibleMeter = visibleCols.filter((c) => meterKeys.includes(c.key));
                  const meterShortLabel: { [k: string]: string } = {
                    meterDiameter: "قطر",
                    meterBrand: "ماركة",
                    meterPrepaid: "شاسيه",
                  };
                  let meterRendered = false;
                  return (
                    <>
                      <tr>
                        {visibleCols.map((c) => {
                          if (meterKeys.includes(c.key)) {
                            if (meterRendered) return null;
                            meterRendered = true;
                            return (
                              <th key="meter-group" colSpan={visibleMeter.length}>
                                بيانات العداد
                              </th>
                            );
                          }
                          return (
                            <th key={c.key} rowSpan={2}>
                              {c.label}
                            </th>
                          );
                        })}
                      </tr>
                      <tr>
                        {visibleMeter.map((c) => (
                          <th key={c.key}>{meterShortLabel[c.key]}</th>
                        ))}
                      </tr>
                    </>
                  );
                })()}
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    {visibleCols.map((c) => (
                      <td key={c.key}>{cellValue(r, c.key, startNo + i)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
