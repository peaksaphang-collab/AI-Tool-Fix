"use server";

import { createClient } from "@/lib/supabase/server";

export interface TrackResult {
  tracking_code: string;
  status: "pending" | "in_progress" | "done" | "cannot_proceed";
  urgency: string | null;
  building_name: string;
  room_name: string;
  service_type_name: string | null;
  equipment: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export async function lookupReport(
  code: string
): Promise<{ ok: true; report: TrackResult } | { ok: false; message: string }> {
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length !== 6) {
    return { ok: false, message: "รหัสติดตามมี 6 ตัวอักษร เช่น RP8F3K" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_report_status", {
    code: clean,
  });

  if (error) {
    console.error("lookupReport failed:", error);
    return { ok: false, message: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่" };
  }

  const report = (data as TrackResult[] | null)?.[0];
  if (!report) {
    return { ok: false, message: "ไม่พบรหัสนี้ ลองตรวจตัวอักษรอีกครั้ง" };
  }

  return { ok: true, report };
}

// ให้คะแนนความพึงพอใจด้วยรหัสติดตาม — ให้ได้เฉพาะใบที่ปิดงานแล้ว และครั้งเดียว
// ฐานข้อมูลเป็นผู้บังคับเงื่อนไขทั้งหมด (ฟังก์ชัน rate_report)
export async function rateReport(
  code: string,
  rating: number,
  comment: string
): Promise<{ ok: boolean; message: string }> {
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "กรุณาเลือกคะแนน 1-5 ดาว" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rate_report", {
    code: clean,
    rating,
    comment: comment.trim() || null,
  });

  if (error) {
    console.error("rateReport failed:", error);
    // ฐานที่ยังไม่ได้รัน migration 0009 จะยังไม่มีฟังก์ชันนี้
    return { ok: false, message: "ระบบประเมินยังไม่พร้อม กรุณาลองใหม่ภายหลัง" };
  }

  switch (data) {
    case "ok":
      return { ok: true, message: "ขอบคุณสำหรับคะแนนครับ" };
    case "already_rated":
      return { ok: false, message: "ให้คะแนนเรื่องนี้ไปแล้ว ขอบคุณครับ" };
    case "not_closed":
      return { ok: false, message: "ให้คะแนนได้เมื่อปิดงานแล้วเท่านั้น" };
    case "not_found":
      return { ok: false, message: "ไม่พบรหัสนี้" };
    default:
      return { ok: false, message: "ให้คะแนนไม่สำเร็จ กรุณาลองใหม่" };
  }
}
