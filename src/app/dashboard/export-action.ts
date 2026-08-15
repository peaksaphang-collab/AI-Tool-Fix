"use server";

import { createClient } from "@/lib/supabase/server";
import { slaInfo, SLA_LABEL } from "@/lib/sla";

const STATUS_TH: Record<string, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
  done: "เสร็จแล้ว",
  cannot_proceed: "ดำเนินการไม่ได้",
};

const URGENCY_TH: Record<string, string> = {
  critical: "วิกฤต",
  high: "ด่วน",
  medium: "ปานกลาง",
  low: "ไม่เร่งด่วน",
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // ครอบด้วยเครื่องหมายคำพูดเมื่อมีตัวคั่น/บรรทัดใหม่/เครื่องหมายคำพูด
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ส่งออกทุกใบเป็น CSV (UTF-8 พร้อม BOM ให้ Excel เปิดภาษาไทยได้ถูกต้อง)
// เจ้าหน้าที่เท่านั้น — RLS ของ reports คุมสิทธิ์อีกชั้นอยู่แล้ว
export async function exportReportsCsv(): Promise<
  { ok: true; filename: string; content: string } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "กรุณาเข้าสู่ระบบ" };

  const [{ data: reports, error }, { data: buildings }, { data: rooms }, { data: types }, { data: staff }] =
    await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("buildings").select("id,name"),
      supabase.from("rooms").select("id,name,floor"),
      supabase.from("service_types").select("id,name"),
      supabase.from("staff").select("id,full_name"),
    ]);

  if (error) return { ok: false, message: error.message };

  const b = new Map((buildings ?? []).map((x) => [x.id, x.name]));
  const r = new Map((rooms ?? []).map((x) => [x.id, x.floor ? `${x.name} (ชั้น ${x.floor})` : x.name]));
  const t = new Map((types ?? []).map((x) => [x.id, x.name]));
  const s = new Map((staff ?? []).map((x) => [x.id, x.full_name]));
  const now = Date.now();

  const header = [
    "รหัสติดตาม",
    "วันที่แจ้ง",
    "อาคาร",
    "ห้อง",
    "ประเภทงาน",
    "อุปกรณ์",
    "อาการ (AI)",
    "ความเร่งด่วน",
    "SLA",
    "สถานะ",
    "ผลตาม SLA",
    "ผู้รับผิดชอบ",
    "ผู้แจ้ง",
    "เบอร์ติดต่อ",
    "วันที่ปิดงาน",
    "ใช้เวลา (ชม.)",
    "AI ทายประเภท",
    "AI ทายความเร่งด่วน",
    "AI มั่นใจ",
    "เวลากรอกฟอร์ม (วิ)",
    "คะแนนความพึงพอใจ",
    "ความเห็น",
  ];

  const rows = (reports ?? []).map((x) => {
    const sla = slaInfo(x, now);
    const hours =
      x.resolved_at
        ? ((new Date(x.resolved_at).getTime() - new Date(x.created_at).getTime()) / 3_600_000).toFixed(1)
        : "";
    return [
      x.tracking_code,
      new Date(x.created_at).toLocaleString("th-TH"),
      b.get(x.building_id) ?? "",
      r.get(x.room_id) ?? "",
      x.service_type_id ? t.get(x.service_type_id) ?? "" : "",
      x.ai_equipment_type,
      x.ai_description,
      x.urgency ? URGENCY_TH[x.urgency] : "",
      SLA_LABEL[x.urgency ?? "medium"],
      STATUS_TH[x.status] ?? x.status,
      sla.label,
      x.assigned_to ? s.get(x.assigned_to) ?? "" : "",
      x.reporter_name,
      x.contact_phone,
      x.resolved_at ? new Date(x.resolved_at).toLocaleString("th-TH") : "",
      hours,
      x.ai_suggested_service_type_id ? t.get(x.ai_suggested_service_type_id) ?? "" : "",
      x.ai_suggested_urgency ? URGENCY_TH[x.ai_suggested_urgency] : "",
      x.ai_confidence,
      x.submit_seconds,
      x.satisfaction_rating,
      x.satisfaction_comment,
    ]
      .map(csvCell)
      .join(",");
  });

  const content = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return { ok: true, filename: `repair-reports-${stamp}.csv`, content };
}
