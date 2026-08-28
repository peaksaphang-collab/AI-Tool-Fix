"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// จัดการทะเบียนอาคาร/ห้อง — เจ้าหน้าที่เพิ่ม/แก้/ลบเองได้โดยไม่ต้องแก้ SQL
// RLS "staff manage buildings/rooms" (0001/0006) คุมสิทธิ์อยู่แล้ว
// ทุก action เช็ค is_staff ซ้ำอีกชั้นก่อนเขียน

export interface PlaceState {
  ok: boolean;
  message?: string;
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  const { data } = await supabase.from("staff").select("id").eq("id", user.id).maybeSingle();
  if (!data) throw new Error("forbidden");
  return supabase;
}

export async function addBuilding(_prev: PlaceState, formData: FormData): Promise<PlaceState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: "ชื่ออาคารต้องยาว 2-120 ตัวอักษร" };
  }
  try {
    const supabase = await requireStaff();
    const { error } = await supabase.from("buildings").insert({ name });
    if (error) {
      return { ok: false, message: error.code === "23505" ? "มีอาคารชื่อนี้อยู่แล้ว" : "เพิ่มไม่สำเร็จ" };
    }
    revalidatePath("/dashboard/places");
    return { ok: true, message: `เพิ่มอาคาร "${name}" แล้ว` };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

export async function addRoom(_prev: PlaceState, formData: FormData): Promise<PlaceState> {
  const buildingId = String(formData.get("buildingId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const floorRaw = String(formData.get("floor") ?? "").trim();
  if (!buildingId) return { ok: false, message: "กรุณาเลือกอาคาร" };
  if (name.length < 1 || name.length > 120) {
    return { ok: false, message: "ชื่อห้องต้องยาว 1-120 ตัวอักษร" };
  }
  try {
    const supabase = await requireStaff();
    const { error } = await supabase
      .from("rooms")
      .insert({ building_id: buildingId, name, floor: floorRaw || null });
    if (error) {
      return { ok: false, message: error.code === "23505" ? "มีห้องชื่อนี้ในอาคารนี้แล้ว" : "เพิ่มไม่สำเร็จ" };
    }
    revalidatePath("/dashboard/places");
    return { ok: true, message: `เพิ่มห้อง "${name}" แล้ว` };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

// ลบได้เฉพาะเมื่อไม่มีใบแจ้งซ่อมผูกอยู่ — กันข้อมูลประวัติหาย
export async function deleteRoom(roomId: string): Promise<PlaceState> {
  try {
    const supabase = await requireStaff();
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);
    if ((count ?? 0) > 0) {
      return { ok: false, message: "ลบไม่ได้ — มีใบแจ้งซ่อมผูกกับห้องนี้อยู่" };
    }
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) return { ok: false, message: "ลบไม่สำเร็จ" };
    revalidatePath("/dashboard/places");
    return { ok: true };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

export async function deleteBuilding(buildingId: string): Promise<PlaceState> {
  try {
    const supabase = await requireStaff();
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId);
    if ((count ?? 0) > 0) {
      return { ok: false, message: "ลบไม่ได้ — มีใบแจ้งซ่อมผูกกับอาคารนี้อยู่" };
    }
    // ลบห้องในอาคารก่อน (rooms อ้าง building_id, cascade อยู่แล้วแต่กันไว้ให้ชัด)
    await supabase.from("rooms").delete().eq("building_id", buildingId);
    const { error } = await supabase.from("buildings").delete().eq("id", buildingId);
    if (error) return { ok: false, message: "ลบไม่สำเร็จ" };
    revalidatePath("/dashboard/places");
    return { ok: true };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}
