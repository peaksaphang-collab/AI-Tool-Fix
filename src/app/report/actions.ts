"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { analyzePhoto } from "@/lib/ai/analyze-photo";
import { getReporter } from "@/lib/reporter";

export interface SubmitReportState {
  status: "idle" | "success" | "error";
  message?: string;
  trackingCode?: string;
}

const ALLOWED_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

// รหัสติดตามให้ผู้แจ้ง — ตัดตัวที่สับสน (0/O, 1/I) ออก บอกกันปากเปล่าได้ไม่ผิด
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeTrackingCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData
): Promise<SubmitReportState> {
  const buildingId = formData.get("buildingId");
  const locationRaw = formData.get("locationDetail");
  const assignedRaw = formData.get("assignedTo");
  const reporterName = formData.get("reporterName");
  const contactPhone = formData.get("contactPhone");
  const serviceTypeRaw = formData.get("serviceTypeId");
  const elapsedRaw = formData.get("elapsedSeconds");
  const photo = formData.get("photo");

  const reporter = await getReporter();
  if (!reporter) {
    return { status: "error", message: "กรุณาเลือกประเภทผู้ใช้ก่อนแจ้งซ่อม" };
  }

  if (typeof buildingId !== "string" || !buildingId) {
    return { status: "error", message: "กรุณาเลือกหน่วยงาน" };
  }
  const locationDetail =
    typeof locationRaw === "string" ? locationRaw.trim().slice(0, 200) : "";
  if (!locationDetail) {
    return { status: "error", message: "กรุณาระบุห้องหรือจุดที่เสีย" };
  }
  if (!(photo instanceof File) || photo.size === 0) {
    return { status: "error", message: "กรุณาถ่ายรูปหรือเลือกรูปภาพ" };
  }

  const mediaType = ALLOWED_TYPES[photo.type];
  if (!mediaType) {
    return { status: "error", message: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP)" };
  }

  const supabase = await createClient();
  const bytes = new Uint8Array(await photo.arrayBuffer());

  const extension = mediaType.split("/")[1];
  const photoPath = `${buildingId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("report-photos")
    .upload(photoPath, bytes, { contentType: photo.type });

  if (uploadError) {
    console.error("Photo upload failed:", uploadError);
    return { status: "error", message: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่" };
  }

  // Analysis is best-effort — a failure here still lets the report through
  // with empty AI fields, so staff can classify it manually instead.
  const base64 = Buffer.from(bytes).toString("base64");
  const analysis = await analyzePhoto(base64, mediaType);

  const pickedServiceType =
    typeof serviceTypeRaw === "string" && /^[1-5]$/.test(serviceTypeRaw)
      ? Number(serviceTypeRaw)
      : null;

  // เวลาที่ผู้ใช้ใช้กรอกจริง — ใช้วัดวัตถุประสงค์ "ลดเวลาแจ้ง" ของงานวิจัย
  const elapsedSeconds =
    typeof elapsedRaw === "string" && /^\d{1,5}$/.test(elapsedRaw)
      ? Math.min(Number(elapsedRaw), 7200)
      : null;

  const baseRow = {
    building_id: buildingId,
    room_id: null,
    location_detail: locationDetail,
    // ผู้แจ้งเลือกผู้รับผิดชอบจากรายชื่อได้ ฐานข้อมูลตรวจว่ามีชื่อนี้จริง (FK)
    technician_id:
      typeof assignedRaw === "string" && /^[0-9a-f-]{36}$/i.test(assignedRaw)
        ? assignedRaw
        : null,
    photo_path: photoPath,
    reporter_type: reporter.type,
    reporter_code: reporter.type === "internal" ? reporter.code : null,
    reporter_name:
      reporter.type === "internal"
        ? reporter.name
        : typeof reporterName === "string" && reporterName.trim()
          ? reporterName.trim().slice(0, 100)
          : null,
    contact_phone:
      typeof contactPhone === "string" && contactPhone.trim()
        ? contactPhone.trim()
        : null,
    service_type_id: pickedServiceType ?? analysis?.serviceTypeId ?? null,
    urgency: analysis?.urgency ?? null,
    ai_equipment_type: analysis?.equipmentType ?? null,
    ai_description: analysis?.description ?? null,
    ai_confidence: analysis?.confidence ?? null,
  };

  // คำทายดั้งเดิมของ AI + เวลากรอกฟอร์ม — เก็บแยกไว้ถาวรเพื่อวัดผลงานวิจัย
  // (ต้องรัน migration 0009 ก่อนจึงจะมีคอลัมน์เหล่านี้)
  const researchRow = {
    ai_suggested_service_type_id: analysis?.serviceTypeId ?? null,
    ai_suggested_urgency: analysis?.urgency ?? null,
    ai_suggested_equipment: analysis?.equipmentType ?? null,
    submit_seconds: elapsedSeconds,
  };

  // ยังไม่ได้รัน migration 0009 ก็ยังต้องรับแจ้งซ่อมได้ — ถ้าฐานยังไม่มี
  // คอลัมน์วิจัย ให้ตัดทิ้งแล้วบันทึกส่วนที่เหลือแทนที่จะปฏิเสธทั้งใบ
  const isUnknownColumn = (code?: string) =>
    code === "PGRST204" || code === "42703";

  // ชนรหัสซ้ำมีโอกาสน้อยมาก (1 ใน พันล้าน) แต่กันไว้ด้วยการลองใหม่
  let trackingCode = makeTrackingCode();
  let includeResearch = true;
  let insertError = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await supabase.from("reports").insert({
      ...baseRow,
      ...(includeResearch ? researchRow : {}),
      tracking_code: trackingCode,
    });

    if (!error) {
      insertError = null;
      break;
    }
    insertError = error;

    if (includeResearch && isUnknownColumn(error.code)) {
      console.warn("Research columns missing — run migration 0009. Falling back.");
      includeResearch = false;
      continue;
    }
    if (error.code !== "23505") break; // ไม่ใช่รหัสซ้ำ ก็ไม่ต้องลองใหม่
    trackingCode = makeTrackingCode();
  }

  if (insertError) {
    console.error("Report insert failed:", insertError);
    await supabase.storage.from("report-photos").remove([photoPath]);
    return { status: "error", message: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
  }

  return {
    status: "success",
    message: "แจ้งซ่อมเรียบร้อยแล้ว ขอบคุณครับ",
    trackingCode,
  };
}
