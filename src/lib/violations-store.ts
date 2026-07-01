import Dexie, { type Table } from "dexie";

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
  sewageTrespass: number;
  sewageDamages: number;
  sewageSettlement: number;
  consumptionMonths: string;
  consumption: string;
  sewageConsumptionMonths: string;
  sewageConsumption: string;
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
  createdAt?: number;
}

/* ================= Dexie (IndexedDB) — SQL-like offline DB ================= */
class ViolationsDB extends Dexie {
  records!: Table<Record, string>;
  constructor() {
    super("gamasa_violations_db");
    this.version(1).stores({
      // primary key + indexed columns for fast filters/search
      records: "id, subscription, branch, violationType, violatorName, cardNumber, date, createdAt, [branch+subscription]",
    });
  }
}

let _db: ViolationsDB | null = null;
function db(): ViolationsDB {
  if (!_db) _db = new ViolationsDB();
  return _db;
}

const LEGACY_KEY = "violation_records_v1";
const MIGRATED_FLAG = "violation_records_migrated_v1";
let migrationPromise: Promise<void> | null = null;

async function ensureMigrated(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_FLAG) === "1") return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (raw) {
          const arr: Record[] = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) {
            const now = Date.now();
            const withTs = arr.map((r, i) => ({ ...r, createdAt: r.createdAt ?? now + i }));
            await db().records.bulkPut(withTs);
          }
        }
        localStorage.setItem(MIGRATED_FLAG, "1");
      } catch (e) {
        console.error("Migration failed", e);
      }
    })();
  }
  return migrationPromise;
}

export async function loadRecords(): Promise<Record[]> {
  if (typeof window === "undefined") return [];
  await ensureMigrated();
  return db().records.orderBy("createdAt").toArray();
}

export async function countRecords(): Promise<number> {
  if (typeof window === "undefined") return 0;
  await ensureMigrated();
  return db().records.count();
}

export async function addRecord(record: Record): Promise<void> {
  await ensureMigrated();
  await db().records.put({ ...record, createdAt: record.createdAt ?? Date.now() });
}

export async function deleteRecord(id: string): Promise<void> {
  await ensureMigrated();
  await db().records.delete(id);
}

export async function clearAllRecords(): Promise<void> {
  await ensureMigrated();
  await db().records.clear();
}

/** Check if subscription already exists in same branch (async, uses compound index) */
export async function isDuplicateSubscription(
  subscription: string,
  branch: string,
  excludeId?: string
): Promise<boolean> {
  const s = (subscription || "").trim();
  const b = (branch || "").trim();
  if (!s || !b) return false;
  await ensureMigrated();
  const hits = await db().records.where("[branch+subscription]").equals([b, s]).toArray();
  return hits.some((r) => r.id !== excludeId);
}

/* ================= Business rules (sync) ================= */
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
