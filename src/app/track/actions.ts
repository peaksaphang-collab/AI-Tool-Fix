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
