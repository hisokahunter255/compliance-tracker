import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { type Record, loadRecords } from "@/lib/violations-store";

export const Route = createFileRoute("/inputs")({
  head: () => ({
    meta: [
      { title: "تقرير الإدخالات - نظام جمصة" },
      { name: "description", content: "تقرير إدخالات العدادات والاشتراكات جاهز للطباعة" },
    ],
  }),
  component: InputsReport,
});

function InputsReport() {
  const [records, setRecords] = useState<Record[]>([]);
  useEffect(() => { setRecords(loadRecords()); }, []);

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold">تقرير الإدخالات (صفحة 4)</h1>
            <p className="text-sm text-muted-foreground mt-1">جاهز للطباعة - أفقي A4</p>
          </div>
          <div className="flex gap-2">
            <Link to="/records" className="btn-secondary">رجوع للسجلات</Link>
            <Link to="/violations" className="btn-secondary">تقرير المخالفات</Link>
            <button className="btn-primary" onClick={() => window.print()}>🖨 طباعة</button>
          </div>
        </div>

        <div className="section-card print-page">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">الإدخالات - منطقة جمصة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="report-table">
              <thead>
                <tr>
                  <th rowSpan={2}>م</th>
                  <th rowSpan={2}>رقم الحساب</th>
                  <th rowSpan={2}>رقم الملف</th>
                  <th rowSpan={2}>كود المشترك</th>
                  <th rowSpan={2}>اسم المشترك</th>
                  <th rowSpan={2}>العنوان</th>
                  <th rowSpan={2}>رقم البطاقة</th>
                  <th rowSpan={2}>نوع الحساب</th>
                  <th colSpan={3}>بيانات العداد</th>
                  <th rowSpan={2}>الصرف الصحي</th>
                  <th rowSpan={2}>تاريخ الفتح والتركيب</th>
                  <th rowSpan={2}>رقم القسيمة</th>
                  <th rowSpan={2}>وصف النشاط</th>
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
                    <td>{i + 1}</td>
                    <td></td>
                    <td></td>
                    <td></td>
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
                    <td>{r.activityDescription}</td>
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
