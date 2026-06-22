import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  type Record,
  type ViolationType,
  type SewageStatus,
  addRecord,
  trespassFor,
  damagesFor,
  wasteFor,
  contractViolationFor,
  calcTax,
  calcSettlement,
  calcTotal,
  fmt,
} from "@/lib/violations-store";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "إدخال مخالفة جديدة - نظام جمصة" },
      { name: "description", content: "نموذج إدخال بيانات المخالفات الخاصة بمنطقة جمصة" },
    ],
  }),
  component: EntryPage,
});

const ACTIVITIES = ["تجاري", "منزلي", "أخرى"];
const VIOLATION_TYPES: ViolationType[] = ["مياه", "صرف", "شروط تعاقد"];
const SEWAGE_OPTIONS: SewageStatus[] = ["خاضع", "غير خاضع"];

function emptyRecord(): Partial<Record> {
  return {
    region: "جمصة",
    branch: "",
    name: "",
    subscription: "",
    committeeNo: "1",
    violatorName: "",
    violationType: "مياه",
    unitDescription: "",
    activity: "تجاري",
    trespass: 5000,
    damages: 500,
    waste: 60.05,
    constructionWater: 0,
    insurance: 0,
    networkConnection: 0,
    tax: 0,
    contractViolation: 0,
    consumptionMonths: "",
    consumption: "",
    settlement: 500,
    date: new Date().toISOString().slice(0, 10),
    address: "",
    cardNumber: "",
    meterDiameter: "¾",
    meterBrand: "كارت شاسيه",
    meterPrepaid: "مسبوق الدفع",
    sewage: "غير خاضع",
    voucherNumber: "",
    notes: "",
  };
}

function EntryPage() {
  const [form, setForm] = useState<Partial<Record>>(emptyRecord());
  const [savedCount, setSavedCount] = useState(0);

  const update = (patch: Partial<Record>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.violationType !== undefined) {
        const t = patch.violationType;
        next.trespass = trespassFor(t);
        next.damages = damagesFor(t);
        next.waste = wasteFor(t);
        next.contractViolation = contractViolationFor(t);
        next.settlement = calcSettlement(next.trespass);
      }
      if (patch.networkConnection !== undefined) {
        next.tax = calcTax(Number(patch.networkConnection) || 0);
      }
      return next;
    });
  };

  const total = calcTotal(form);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRecord: Record = {
      ...(form as Record),
      id: crypto.randomUUID(),
      totalViolation: total,
      installDate: form.date || "",
      activityDescription: form.unitDescription || "",
    };
    addRecord(finalRecord);
    setSavedCount((c) => c + 1);
    setForm(emptyRecord());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدخال مخالفة جديدة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              عدد المخالفات المحفوظة في هذه الجلسة: {savedCount}
            </p>
          </div>
          <Link to="/records" className="btn-secondary">عرض السجلات ({savedCount > 0 ? "تحديث" : "0"})</Link>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* بيانات أساسية */}
          <div className="section-card">
            <div className="section-title">بيانات المخالف</div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="المنطقة">
                <input className="field-input" value={form.region} readOnly />
              </Field>
              <Field label="الفرع">
                <input className="field-input" value={form.branch} onChange={(e) => update({ branch: e.target.value })} required />
              </Field>
              <Field label="الاسم">
                <input className="field-input" value={form.name} onChange={(e) => update({ name: e.target.value })} required />
              </Field>
              <Field label="الاشتراك">
                <input className="field-input" value={form.subscription} onChange={(e) => update({ subscription: e.target.value })} />
              </Field>
              <Field label="رقم اللجنة">
                <select className="field-input" value={form.committeeNo} onChange={(e) => update({ committeeNo: e.target.value })}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </Field>
              <Field label="اسم المخالف">
                <input className="field-input" value={form.violatorName} onChange={(e) => update({ violatorName: e.target.value })} required />
              </Field>
              <Field label="رقم البطاقة">
                <input className="field-input" value={form.cardNumber} onChange={(e) => update({ cardNumber: e.target.value })} />
              </Field>
              <Field label="التاريخ">
                <input type="date" className="field-input" value={form.date} onChange={(e) => update({ date: e.target.value })} />
              </Field>
              <Field label="العنوان" className="md:col-span-2 lg:col-span-4">
                <input className="field-input" value={form.address} onChange={(e) => update({ address: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* بيانات المخالفة */}
          <div className="section-card">
            <div className="section-title">تفاصيل المخالفة</div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="نوع المخالفة">
                <select
                  className="field-input"
                  value={form.violationType}
                  onChange={(e) => update({ violationType: e.target.value as ViolationType })}
                >
                  {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="النشاط">
                <select
                  className="field-input"
                  value={ACTIVITIES.includes(form.activity || "") ? form.activity : "أخرى"}
                  onChange={(e) => update({ activity: e.target.value })}
                >
                  {ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              {(!ACTIVITIES.includes(form.activity || "") || form.activity === "أخرى") && (
                <Field label="تحديد النشاط (يدوي)">
                  <input
                    className="field-input"
                    value={form.activity === "أخرى" ? "" : form.activity}
                    placeholder="اكتب النشاط"
                    onChange={(e) => update({ activity: e.target.value })}
                  />
                </Field>
              )}
              <Field label="توصيف الوحدة المخالفة" className="md:col-span-3 lg:col-span-2">
                <input className="field-input" value={form.unitDescription} onChange={(e) => update({ unitDescription: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* القيم المالية */}
          <div className="section-card">
            <div className="section-title">المبالغ المالية</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Field label="تعدي">
                <input type="number" step="0.01" className="field-input" value={form.trespass} onChange={(e) => update({ trespass: +e.target.value, settlement: calcSettlement(+e.target.value) })} />
              </Field>
              <Field label="التلفيات">
                <input type="number" step="0.01" className="field-input" value={form.damages} onChange={(e) => update({ damages: +e.target.value })} />
              </Field>
              <Field label="إهدار">
                <input type="number" step="0.01" className="field-input" value={form.waste} onChange={(e) => update({ waste: +e.target.value })} />
              </Field>
              <Field label="مياه إنشاءات">
                <input type="number" step="0.01" className="field-input" value={form.constructionWater} onChange={(e) => update({ constructionWater: +e.target.value })} />
              </Field>
              <Field label="تأمين">
                <input type="number" step="0.01" className="field-input" value={form.insurance} onChange={(e) => update({ insurance: +e.target.value })} />
              </Field>
              <Field label="ربط شبكات">
                <input type="number" step="0.01" className="field-input" value={form.networkConnection} onChange={(e) => update({ networkConnection: +e.target.value })} />
              </Field>
              <Field label="ضريبة (14% من ربط الشبكات)">
                <input className="field-input" value={fmt(form.tax)} readOnly />
              </Field>
              <Field label="مخالفة شروط تعاقد">
                <input type="number" step="0.01" className="field-input" value={form.contractViolation} onChange={(e) => update({ contractViolation: +e.target.value })} />
              </Field>
              <Field label="تصالح (10% من التعدي)">
                <input type="number" step="0.01" className="field-input" value={form.settlement} onChange={(e) => update({ settlement: +e.target.value })} />
              </Field>
              <Field label="إجمالي المخالفة">
                <input className="field-input font-bold" style={{ color: "var(--color-primary)" }} value={fmt(total)} readOnly />
              </Field>
              <Field label="عدد شهور الاستهلاك">
                <input className="field-input" value={form.consumptionMonths} onChange={(e) => update({ consumptionMonths: e.target.value })} />
              </Field>
              <Field label="الاستهلاك">
                <input className="field-input" value={form.consumption} onChange={(e) => update({ consumption: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* بيانات العداد */}
          <div className="section-card">
            <div className="section-title">بيانات العداد والصرف الصحي</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="قطر العداد">
                <input className="field-input" value={form.meterDiameter} readOnly />
              </Field>
              <Field label="الماركة">
                <input className="field-input" value={form.meterBrand} readOnly />
              </Field>
              <Field label="نوع العداد">
                <input className="field-input" value={form.meterPrepaid} readOnly />
              </Field>
              <Field label="الصرف الصحي">
                <select className="field-input" value={form.sewage} onChange={(e) => update({ sewage: e.target.value as SewageStatus })}>
                  {SEWAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="تاريخ الفتح والتركيب">
                <input className="field-input" value={form.date} readOnly />
              </Field>
              <Field label="رقم القسيمة">
                <input className="field-input" value={form.voucherNumber} onChange={(e) => update({ voucherNumber: e.target.value })} />
              </Field>
              <Field label="ملاحظات" className="md:col-span-2">
                <input className="field-input" value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-4">
            <button type="button" className="btn-secondary" onClick={() => setForm(emptyRecord())}>
              إعادة تعيين
            </button>
            <button type="submit" className="btn-primary">
              التالي — حفظ والانتقال للسجل
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
