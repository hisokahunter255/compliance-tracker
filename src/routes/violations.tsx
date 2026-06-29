import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record as ViolationRecord, loadRecords, fmt, loadHiddenColumns, saveHiddenColumns } from "@/lib/violations-store";
import { exportElementToPdf, exportTableToExcel } from "@/lib/export-utils";
import { ColumnSettings, type ColumnDef } from "@/components/ColumnSettings";

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

const REPORT_ID = "violations";

const COLUMNS: ColumnDef[] = [
  { key: "no", label: "م" },
  { key: "region", label: "المنطقة" },
  { key: "branch", label: "الفرع" },
  { key: "subscription", label: "الاشتراك" },
  { key: "committeeNo", label: "رقم اللجنة" },
  { key: "violatorName", label: "اسم المخالف" },
  { key: "violationType", label: "نوع المخالفة" },
  { key: "unitDescription", label: "توصيف الوحدة" },
  { key: "activity", label: "النشاط" },
  { key: "trespass", label: "تعدي" },
  { key: "damages", label: "تلفيات" },
  { key: "waste", label: "إهدار" },
  { key: "constructionWater", label: "مياه إنشاءات" },
  { key: "insurance", label: "تأمين" },
  { key: "networkConnection", label: "ربط شبكات" },
  { key: "tax", label: "ضريبة" },
  { key: "contractViolation", label: "مخ. ش تعاقد" },
  { key: "consumptionMonths", label: "شهور" },
  { key: "consumption", label: "الاستهلاك" },
  { key: "settlement", label: "تصالح" },
  { key: "totalViolation", label: "إجمالي" },
  { key: "date", label: "التاريخ" },
  { key: "notes", label: "ملاحظات" },
];

/** Expand combined "مياه + صرف" into two display rows */
type Row = {
  rec: ViolationRecord;
  variant: "single" | "water" | "sewage";
  no: number; // display sequential
};

function expandRecords(records: ViolationRecord[], startNo: number): Row[] {
  const rows: Row[] = [];
  let n = startNo;
  for (const r of records) {
    if (r.violationType === "مياه + صرف") {
      rows.push({ rec: r, variant: "water", no: n++ });
      rows.push({ rec: r, variant: "sewage", no: n++ });
    } else {
      rows.push({ rec: r, variant: "single", no: n++ });
    }
  }
  return rows;
}

function cellValue(row: Row, key: string): React.ReactNode {
  const r = row.rec;
  const v = row.variant;
  // Per-variant numeric overrides for combined records
  if (v === "water") {
    switch (key) {
      case "violationType": return "مياه";
      case "trespass": return fmt(r.trespass);
      case "damages": return fmt(r.damages);
      case "waste": return fmt(r.waste);
      case "settlement": return fmt(r.settlement);
      case "totalViolation": return <strong>{fmt((r.trespass || 0) + (r.damages || 0) + (r.waste || 0) + (r.constructionWater || 0) + (r.insurance || 0) + (r.networkConnection || 0) + (r.tax || 0) + (r.contractViolation || 0) + (r.settlement || 0))}</strong>;
    }
  } else if (v === "sewage") {
    switch (key) {
      case "violationType": return "صرف";
      case "trespass": return fmt(r.sewageTrespass);
      case "damages": return fmt(r.sewageDamages);
      case "waste": return "";
      case "constructionWater":
      case "insurance":
      case "networkConnection":
      case "tax":
      case "contractViolation":
        return "";
      case "settlement": return fmt(r.sewageSettlement);
      case "consumptionMonths": return r.sewageConsumptionMonths;
      case "consumption": return r.sewageConsumption;
      case "totalViolation": return <strong>{fmt((r.sewageTrespass || 0) + (r.sewageDamages || 0) + (r.sewageSettlement || 0))}</strong>;
    }
  }
  switch (key) {
    case "no": return row.no;
    case "region": return r.region;
    case "branch": return r.branch;
    case "subscription": return r.subscription;
    case "committeeNo": return r.committeeNo;
    case "violatorName": return r.violatorName;
    case "violationType": return r.violationType;
    case "unitDescription": return r.unitDescription;
    case "activity": return r.activity;
    case "trespass": return fmt(r.trespass);
    case "damages": return fmt(r.damages);
    case "waste": return fmt(r.waste);
    case "constructionWater": return fmt(r.constructionWater);
    case "insurance": return fmt(r.insurance);
    case "networkConnection": return fmt(r.networkConnection);
    case "tax": return fmt(r.tax);
    case "contractViolation": return fmt(r.contractViolation);
    case "consumptionMonths": return r.consumptionMonths;
    case "consumption": return r.consumption;
    case "settlement": return fmt(r.settlement);
    case "totalViolation": return <strong>{fmt(r.totalViolation)}</strong>;
    case "date": return r.date;
    case "notes": return r.notes;
  }
  return "";
}

function ViolationsReport() {
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
      [r.subscription, r.violatorName, r.branch, r.committeeNo, r.violationType, r.activity, r.unitDescription, r.address, r.cardNumber]
        .some((v) => (v || "").toString().toLowerCase().includes(q))
    );
  }, [ranged, query]);

  const startNo = (from && from > 0 ? from : 1);
  const rows = useMemo(() => expandRecords(records, startNo), [records, startNo]);

  const totals = rows.reduce(
    (acc, row) => {
      const r = row.rec;
      const v = row.variant;
      if (v === "sewage") {
        acc.trespass += r.sewageTrespass || 0;
        acc.damages += r.sewageDamages || 0;
        acc.settlement += r.sewageSettlement || 0;
        acc.total += (r.sewageTrespass || 0) + (r.sewageDamages || 0) + (r.sewageSettlement || 0);
      } else if (v === "water") {
        acc.trespass += r.trespass || 0;
        acc.damages += r.damages || 0;
        acc.waste += r.waste || 0;
        acc.constructionWater += r.constructionWater || 0;
        acc.insurance += r.insurance || 0;
        acc.networkConnection += r.networkConnection || 0;
        acc.tax += r.tax || 0;
        acc.contractViolation += r.contractViolation || 0;
        acc.settlement += r.settlement || 0;
        acc.total += (r.trespass || 0) + (r.damages || 0) + (r.waste || 0) + (r.constructionWater || 0) + (r.insurance || 0) + (r.networkConnection || 0) + (r.tax || 0) + (r.contractViolation || 0) + (r.settlement || 0);
      } else {
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
      }
      return acc;
    },
    { trespass: 0, damages: 0, waste: 0, constructionWater: 0, insurance: 0, networkConnection: 0, tax: 0, contractViolation: 0, settlement: 0, total: 0 }
  );

  const visibleCols = COLUMNS.filter((c) => !hidden.has(c.key));

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
          <div className="flex gap-2 flex-wrap items-center">
            <ColumnSettings columns={COLUMNS} hidden={hidden} onChange={onChangeHidden} />
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/inputs" search={{ from, to } as any} className="btn-secondary">تقرير الإدخالات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
            <button className="btn-success" onClick={() => tableRef.current && exportTableToExcel(tableRef.current, "تقرير_المخالفات", "المخالفات")}>📊 Excel</button>
            <button className="btn-success" onClick={() => pageRef.current && exportElementToPdf(pageRef.current, "تقرير_المخالفات", "landscape")}>📄 PDF</button>
          </div>
        </div>

        <div className="no-print mb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 بحث في الاسم، الاشتراك، الفرع، نوع المخالفة، النشاط..."
            className="field-input w-full max-w-xl"
          />
        </div>

        <div ref={pageRef} className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">المخالفات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table ref={tableRef} className="report-table">
              <thead>
                <tr>
                  {visibleCols.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={`${row.rec.id}-${row.variant}-${i}`}
                    style={row.variant === "sewage" ? { background: "oklch(0.97 0.03 215)" } : undefined}
                  >
                    {visibleCols.map((c) => (
                      <td key={c.key}>{cellValue(row, c.key)}</td>
                    ))}
                  </tr>
                ))}
                {rows.length > 0 && (
                  <TotalsRow visibleCols={visibleCols} totals={totals} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TotalsRow({
  visibleCols,
  totals,
}: {
  visibleCols: ColumnDef[];
  totals: { trespass: number; damages: number; waste: number; constructionWater: number; insurance: number; networkConnection: number; tax: number; contractViolation: number; settlement: number; total: number };
}) {
  const totalMap: { [k: string]: string } = {
    trespass: fmt(totals.trespass),
    damages: fmt(totals.damages),
    waste: fmt(totals.waste),
    constructionWater: fmt(totals.constructionWater),
    insurance: fmt(totals.insurance),
    networkConnection: fmt(totals.networkConnection),
    tax: fmt(totals.tax),
    contractViolation: fmt(totals.contractViolation),
    settlement: fmt(totals.settlement),
    totalViolation: fmt(totals.total),
  };
  // Find first numeric column index to place "الإجمالي" label before it
  const firstNumericIdx = visibleCols.findIndex((c) => totalMap[c.key] !== undefined);
  return (
    <tr style={{ background: "oklch(0.92 0.04 215)", fontWeight: 700 }}>
      {visibleCols.map((c, idx) => {
        if (idx === 0) {
          const span = firstNumericIdx > 0 ? firstNumericIdx : 1;
          if (firstNumericIdx > 0) {
            return <td key={c.key} colSpan={span}>الإجمالي</td>;
          }
          return <td key={c.key}>الإجمالي</td>;
        }
        if (firstNumericIdx > 0 && idx > 0 && idx < firstNumericIdx) return null;
        return <td key={c.key}>{totalMap[c.key] ?? ""}</td>;
      })}
    </tr>
  );
}
