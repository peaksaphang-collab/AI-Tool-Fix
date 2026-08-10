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

  const { error } = await supabase
    .from("reports")
    .update({
      service_type_id: serviceTypeId,
      urgency,
      ai_equipment_type: equipment,
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
