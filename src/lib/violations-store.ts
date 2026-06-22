export type ViolationType = "مياه" | "صرف" | "شروط تعاقد";
export type SewageStatus = "خاضع" | "غير خاضع";

export interface Record {
  id: string;
  region: string; // المنطقة - auto جمصة
  branch: string; // الفرع
  name: string; // الاسم
  subscription: string; // الاشتراك
  committeeNo: string; // رقم اللجنة (1-3)
  violatorName: string; // اسم المخالف
  violationType: ViolationType; // نوع المخالفة
  unitDescription: string; // توصيف الوحدة المخالفة
  activity: string; // النشاط
  trespass: number; // تعدي
  damages: number; // التلفيات
  waste: number; // اهدار
  constructionWater: number; // مياه انشاءات
  insurance: number; // تأمين
  networkConnection: number; // ربط شبكات
  tax: number; // ضريبة
  contractViolation: number; // مخالفة شروط تعاقد
  consumptionMonths: string; // عدد شهور الاستهلاك
  consumption: string; // الاستهلاك
  settlement: number; // تصالح
  totalViolation: number; // اجمالي المخالفة
  date: string; // التاريخ
  address: string; // العنوان
  cardNumber: string; // رقم البطاقة
  meterDiameter: string; // قطر العداد - auto ¾
  meterBrand: string; // ماركة - auto كارت شاسيه
  meterPrepaid: string; // مسبوق الدفع - auto
  sewage: SewageStatus; // الصرف الصحي
  installDate: string; // = date
  voucherNumber: string; // رقم القسيمة
  activityDescription: string; // = unitDescription
  notes: string;
}

const STORAGE_KEY = "violation_records_v1";

export function loadRecords(): Record[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: Record[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function addRecord(record: Record) {
  const records = loadRecords();
  records.push(record);
  saveRecords(records);
}

export function deleteRecord(id: string) {
  saveRecords(loadRecords().filter((r) => r.id !== id));
}

export function trespassFor(type: ViolationType): number {
  if (type === "مياه") return 5000;
  if (type === "صرف") return 2000;
  return 0;
}
export function damagesFor(type: ViolationType): number {
  if (type === "مياه") return 500;
  if (type === "صرف") return 200;
  return 0;
}
export function wasteFor(type: ViolationType): number {
  if (type === "مياه") return 60.05;
  return 0;
}
export function contractViolationFor(type: ViolationType): number {
  return type === "شروط تعاقد" ? 500 : 0;
}
export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
export function calcTax(network: number): number {
  return roundHalf(network * 0.14);
}
export function calcSettlement(trespass: number): number {
  return Math.round(trespass * 0.1 * 100) / 100;
}
export function calcTotal(r: Partial<Record>): number {
  const vals = [
    r.trespass, r.damages, r.waste, r.constructionWater, r.insurance,
    r.networkConnection, r.tax, r.contractViolation, r.settlement,
  ];
  return vals.reduce((s, v) => s + (Number(v) || 0), 0);
}

export function fmt(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "";
  const num = Number(n);
  if (num === 0) return "0";
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
