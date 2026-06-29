export type ViolationType = "مياه" | "صرف" | "شروط تعاقد" | "مياه + صرف";
export type SewageStatus = "خاضع" | "غير خاضع";

export interface Record {
  id: string;
  region: string;
  branch: string;
  subscription: string;
  committeeNo: string;
  violatorName: string;
  violationType: ViolationType;
  unitDescription: string;
  activity: string;
  trespass: number;
  damages: number;
  waste: number;
  constructionWater: number;
  insurance: number;
  networkConnection: number;
  tax: number;
  contractViolation: number;
  // sewage portion (used when violationType === "مياه + صرف")
  sewageTrespass: number;
  sewageDamages: number;
  sewageSettlement: number;
  consumptionMonths: string;
  consumption: string;
  settlement: number;
  totalViolation: number;
  date: string;
  address: string;
  cardNumber: string;
  meterDiameter: string;
  meterBrand: string;
  meterPrepaid: string;
  sewage: SewageStatus;
  installDate: string;
  voucherNumber: string;
  activityDescription: string;
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

/** Check if subscription already exists in same branch */
export function isDuplicateSubscription(subscription: string, branch: string, excludeId?: string): boolean {
  const s = (subscription || "").trim();
  const b = (branch || "").trim();
  if (!s || !b) return false;
  return loadRecords().some(
    (r) => r.id !== excludeId && (r.subscription || "").trim() === s && (r.branch || "").trim() === b
  );
}

export function trespassFor(type: ViolationType): number {
  if (type === "مياه" || type === "مياه + صرف") return 5000;
  if (type === "صرف") return 2000;
  return 0;
}
export function damagesFor(type: ViolationType): number {
  if (type === "مياه" || type === "مياه + صرف") return 500;
  if (type === "صرف") return 200;
  return 0;
}
export function wasteFor(type: ViolationType): number {
  if (type === "مياه" || type === "مياه + صرف") return 60.05;
  return 0;
}
export function contractViolationFor(type: ViolationType): number {
  return type === "شروط تعاقد" ? 500 : 0;
}
export function sewageTrespassFor(type: ViolationType): number {
  return type === "مياه + صرف" ? 2000 : 0;
}
export function sewageDamagesFor(type: ViolationType): number {
  return type === "مياه + صرف" ? 200 : 0;
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
  const vals: Array<number | undefined> = [
    r.trespass, r.damages, r.waste, r.constructionWater, r.insurance,
    r.networkConnection, r.tax, r.contractViolation, r.settlement,
    r.sewageTrespass, r.sewageDamages, r.sewageSettlement,
  ];
  return vals.reduce<number>((s, v) => s + (Number(v) || 0), 0);
}

export function fmt(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(Number(n))) return "";
  const num = Number(n);
  if (num === 0) return "0";
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/* ============ Column visibility (per report) ============ */
const COLS_KEY = "report_hidden_columns_v1";
type HiddenMap = { [reportId: string]: string[] };

export function loadHiddenColumns(reportId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(COLS_KEY);
    const map: HiddenMap = raw ? JSON.parse(raw) : {};
    return new Set(map[reportId] || []);
  } catch {
    return new Set();
  }
}

export function saveHiddenColumns(reportId: string, hidden: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(COLS_KEY);
    const map: HiddenMap = raw ? JSON.parse(raw) : {};
    map[reportId] = Array.from(hidden);
    localStorage.setItem(COLS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
