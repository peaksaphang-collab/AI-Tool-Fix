"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Urgency } from "@/lib/supabase/types";

const URGENCIES: Urgency[] = ["critical", "high", "medium", "low"];

// ให้เจ้าหน้าที่แก้ประเภทงาน/ความด่วน/ชื่ออุปกรณ์เองได้
// จำเป็นเมื่อ AI ไม่ได้วิเคราะห์ (ไม่ได้ตั้ง API key) หรือ AI เดาผิด
export async function updateReportDetails(
  reportId: string,
  values: {
    serviceTypeId: number | null;
    urgency: Urgency | null;
    equipment: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const equipment = values.equipment?.trim().slice(0, 100) || null;
  const urgency =
    values.urgency && URGENCIES.includes(values.urgency) ? values.urgency : null;
  const serviceTypeId =
    values.serviceTypeId && values.serviceTypeId >= 1 && values.serviceTypeId <= 5
      ? values.serviceTypeId
      : null;

  // แก้เฉพาะค่าที่ยืนยันแล้ว — คำทายเดิมของ AI (ai_suggested_*) ไม่ถูกแตะ
  // เพื่อให้ยังคำนวณความแม่นยำของ AI ย้อนหลังได้
  const patch = { service_type_id: serviceTypeId, urgency, ai_equipment_type: equipment };
  const audit = { corrected_at: new Date().toISOString(), corrected_by: user.id };

  let { error } = await supabase
    .from("reports")
    .update({ ...patch, ...audit })
    .eq("id", reportId);

  // ฐานที่ยังไม่ได้รัน migration 0009 ยังไม่มีคอลัมน์ audit — บันทึกค่าหลักให้ได้ก่อน
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    console.warn("Correction audit columns missing — run migration 0009.");
    ({ error } = await supabase.from("reports").update(patch).eq("id", reportId));
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
