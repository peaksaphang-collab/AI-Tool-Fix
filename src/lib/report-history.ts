// ประวัติการแจ้งเก็บไว้ในเครื่องของผู้แจ้งเท่านั้น เพราะผู้แจ้งไม่ต้องล็อกอิน
// ถ้าเก็บฝั่งเซิร์ฟเวอร์แล้วให้ค้นด้วยเบอร์โทรหรืออีเมล จะเปิดช่องให้สุ่มดูใบแจ้ง
// ของคนอื่นได้ทันที รหัสติดตามจึงยังเป็นกุญแจดอกเดียวที่เปิดดูข้อมูลได้

const STORAGE_KEY = "repair-report-history";
const LIMIT = 20;

export interface SavedReport {
  code: string;
  savedAt: string;
}

function isSavedReport(value: unknown): value is SavedReport {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.savedAt === "string";
}

export function normalizeCode(code: string) {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function getReportHistory(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedReport) : [];
  } catch {
    return [];
  }
}

function write(list: SavedReport[]): SavedReport[] {
  if (typeof window === "undefined") return list;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // โหมดส่วนตัวหรือเบราว์เซอร์ที่ปิดที่เก็บข้อมูลจะเขียนไม่ได้
    // ให้ใช้งานหน้าเว็บต่อได้ตามปกติ เพียงแค่ไม่มีประวัติ
  }
  return list;
}

export function saveReportCode(code: string): SavedReport[] {
  const clean = normalizeCode(code);
  if (clean.length !== 6) return getReportHistory();

  const rest = getReportHistory().filter((item) => item.code !== clean);
  return write([{ code: clean, savedAt: new Date().toISOString() }, ...rest].slice(0, LIMIT));
}

export function removeReportCode(code: string): SavedReport[] {
  const clean = normalizeCode(code);
  return write(getReportHistory().filter((item) => item.code !== clean));
}

export function clearReportHistory(): SavedReport[] {
  return write([]);
}
