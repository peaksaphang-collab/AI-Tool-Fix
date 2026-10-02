import { cookies } from "next/headers";

// ผู้แจ้งต้องเลือกประเภทก่อนเข้าหน้าแจ้งซ่อม
// บุคลากรภายในระบุรหัสและชื่อ (ยังไม่เชื่อม PSU Passport จึงไม่มีรหัสผ่าน)
// บุคคลภายนอกเข้าแจ้งได้เลยโดยไม่ต้องมีบัญชี

export const REPORTER_COOKIE = "reporter";
export const REPORTER_CODE = /^[A-Za-z0-9-]{3,20}$/;

export type Reporter =
  | { type: "internal"; code: string; name: string }
  | { type: "external" };

export function parseReporter(raw: string | undefined): Reporter | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.type === "external") return { type: "external" };
    if (
      value?.type === "internal" &&
      typeof value.code === "string" &&
      REPORTER_CODE.test(value.code) &&
      typeof value.name === "string" &&
      value.name.trim().length >= 2 &&
      value.name.length <= 100
    ) {
      return { type: "internal", code: value.code, name: value.name.trim() };
    }
  } catch {
    // คุกกี้เสียหรือถูกแก้มือ ให้เลือกประเภทผู้ใช้ใหม่
  }
  return null;
}

export async function getReporter(): Promise<Reporter | null> {
  const store = await cookies();
  return parseReporter(store.get(REPORTER_COOKIE)?.value);
}
