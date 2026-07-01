import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  type Record,
  type ViolationType,
  type SewageStatus,
  addRecord,
  trespassFor,
  damagesFor,
  wasteFor,
  contractViolationFor,
  sewageTrespassFor,
  sewageDamagesFor,
  calcTax,
  calcSettlement,
  calcTotal,
  fmt,
  isDuplicateSubscription,
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
const VIOLATION_TYPES: ViolationType[] = ["مياه", "مياه + صرف", "صرف", "شروط تعاقد"];
const SEWAGE_OPTIONS: SewageStatus[] = ["خاضع", "غير خاضع"];

function emptyRecord(): Partial<Record> {
  return {
    region: "جمصة",
    branch: "",
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
    sewageTrespass: 0,
    sewageDamages: 0,
    sewageSettlement: 0,
    consumptionMonths: "",
    consumption: "",
    sewageConsumptionMonths: "",
    sewageConsumption: "",
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
        next.sewageTrespass = sewageTrespassFor(t);
        next.sewageDamages = sewageDamagesFor(t);
        next.sewageSettlement = calcSettlement(next.sewageTrespass);
      }
      if (patch.networkConnection !== undefined) {
        next.tax = calcTax(Number(patch.networkConnection) || 0);
      }
      if (patch.address !== undefined) {
        if (/مايو/.test(patch.address || "")) {
          next.sewage = "غير خاضع";
        }
      }
      return next;
    });
  };

  const total = calcTotal(form);

  const [duplicate, setDuplicate] = useState(false);
  useEffect(() => {
    let cancelled = false;
    isDuplicateSubscription(form.subscription || "", form.branch || "").then((d) => {
      if (!cancelled) setDuplicate(d);
    });
    return () => { cancelled = true; };
  }, [form.subscription, form.branch, savedCount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicate) {
      const ok = confirm(
        `⚠️ تنبيه: رقم الحساب "${form.subscription}" موجود مسبقاً في الفرع "${form.branch}".\n\nهل تريد الحفظ رغم ذلك؟`
      );
      if (!ok) return;
    }
    const finalRecord: Record = {
      ...(form as Record),
      id: crypto.randomUUID(),
      totalViolation: total,
      installDate: form.date || "",
      activityDescription: form.unitDescription || "",
    };
    await addRecord(finalRecord);
    setSavedCount((c) => c + 1);
    setForm(emptyRecord());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isCombined = form.violationType === "مياه + صرف";

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
          <Link to="/records" className="btn-secondary">عرض السجلات</Link>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="section-card">
            <div className="section-title">بيانات المخالف</div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="المنطقة">
                <input className="field-input" value={form.region} readOnly />
              </Field>
              <Field label="الفرع">
                <input className="field-input" value={form.branch} onChange={(e) => update({ branch: e.target.value })} required />
              </Field>
              <Field label="الاشتراك">
                <input
                  className="field-input"
                  style={duplicate ? { borderColor: "#dc2626", background: "#fef2f2" } : undefined}
                  value={form.subscription}
                  onChange={(e) => update({ subscription: e.target.value })}
                />
                {duplicate && (
                  <div className="text-xs mt-1 font-semibold" style={{ color: "#dc2626" }}>
                    ⚠️ رقم الحساب مكرر في نفس الفرع
                  </div>
                )}
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
                <input
                  className="field-input"
                  inputMode="numeric"
                  maxLength={14}
                  value={form.cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 14);
                    update({ cardNumber: v });
                  }}
                />
              </Field>
              <Field label="التاريخ">
                <input type="date" className="field-input" value={form.date} onChange={(e) => update({ date: e.target.value })} />
              </Field>
              <Field label="العنوان" className="md:col-span-2 lg:col-span-4">
                <input className="field-input" value={form.address} onChange={(e) => update({ address: e.target.value })} />
              </Field>
            </div>
          </div>

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

          <div className="section-card">
            <div className="section-title">المبالغ المالية{isCombined ? " — مياه" : ""}</div>
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
              <Field label="عدد شهور الاستهلاك">
                <input className="field-input" value={form.consumptionMonths} onChange={(e) => update({ consumptionMonths: e.target.value })} />
              </Field>
              <Field label="الاستهلاك">
                <input className="field-input" value={form.consumption} onChange={(e) => update({ consumption: e.target.value })} />
              </Field>
            </div>
          </div>

          {isCombined && (
            <div className="section-card" style={{ borderColor: "var(--color-primary)" }}>
              <div className="section-title">المبالغ المالية — صرف</div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <Field label="تعدي (صرف)">
                  <input type="number" step="0.01" className="field-input"
                    value={form.sewageTrespass}
                    onChange={(e) => update({ sewageTrespass: +e.target.value, sewageSettlement: calcSettlement(+e.target.value) })}
                  />
                </Field>
                <Field label="التلفيات (صرف)">
                  <input type="number" step="0.01" className="field-input"
                    value={form.sewageDamages}
                    onChange={(e) => update({ sewageDamages: +e.target.value })}
                  />
                </Field>
                <Field label="تصالح (صرف)">
                  <input type="number" step="0.01" className="field-input"
                    value={form.sewageSettlement}
                    onChange={(e) => update({ sewageSettlement: +e.target.value })}
                  />
                </Field>
                <Field label="عدد شهور الاستهلاك (صرف)">
                  <input className="field-input"
                    value={form.sewageConsumptionMonths}
                    onChange={(e) => update({ sewageConsumptionMonths: e.target.value })}
                  />
                </Field>
                <Field label="الاستهلاك (صرف)">
                  <input className="field-input"
                    value={form.sewageConsumption}
                    onChange={(e) => update({ sewageConsumption: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="section-card">
            <div className="section-title">الإجمالي</div>
            <Field label="إجمالي المخالفة (مياه + صرف + باقي البنود)">
              <input className="field-input font-bold text-lg" style={{ color: "var(--color-primary)" }} value={fmt(total)} readOnly />
            </Field>
          </div>

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
