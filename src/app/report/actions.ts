"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { analyzePhoto } from "@/lib/ai/analyze-photo";

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
  const roomId = formData.get("roomId");
  const reporterName = formData.get("reporterName");
  const contactPhone = formData.get("contactPhone");
  const serviceTypeRaw = formData.get("serviceTypeId");
  const photo = formData.get("photo");

  if (typeof buildingId !== "string" || !buildingId) {
    return { status: "error", message: "กรุณาเลือกอาคาร" };
  }
  if (typeof roomId !== "string" || !roomId) {
    return { status: "error", message: "กรุณาเลือกห้อง" };
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

  // ชนรหัสซ้ำมีโอกาสน้อยมาก (1 ใน พันล้าน) แต่กันไว้ด้วยการลองใหม่
  let trackingCode = makeTrackingCode();
  let insertError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("reports").insert({
      building_id: buildingId,
      room_id: roomId,
      photo_path: photoPath,
      tracking_code: trackingCode,
      reporter_name:
        typeof reporterName === "string" && reporterName.trim()
          ? reporterName.trim()
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
    });

    if (!error) {
      insertError = null;
      break;
    }
    insertError = error;
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

// เตือนแจ้งซ้ำ — นับใบที่ยังค้างในห้องเดียวกัน (ตัวเลขล้วน ไม่คืนข้อมูลใคร)
export async function openCountForRoom(roomId: string): Promise<number> {
  if (!roomId) return 0;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_open_count_for_room", {
      room: roomId,
    });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

