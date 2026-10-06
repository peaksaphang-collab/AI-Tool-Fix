"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// จัดการรายชื่อหน่วยงานและผู้รับผิดชอบงาน — เจ้าหน้าที่แก้เองได้โดยไม่ต้องแก้ SQL
// RLS คุมสิทธิ์อยู่แล้ว ทุก action เช็คสิทธิ์เจ้าหน้าที่ซ้ำอีกชั้นก่อนเขียน

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
    return { ok: false, message: "ชื่อหน่วยงานต้องยาว 2-120 ตัวอักษร" };
  }
  try {
    const supabase = await requireStaff();
    const { error } = await supabase.from("buildings").insert({ name });
    if (error?.code === "23505") {
      // ชื่อนี้เคยถูกซ่อนไว้ เปิดกลับมาใช้แทนการสร้างซ้ำ
      const { data } = await supabase
        .from("buildings")
        .update({ active: true })
        .eq("name", name)
        .eq("active", false)
        .select("id");
      revalidatePath("/dashboard/places");
      return data?.length
        ? { ok: true, message: `เปิดใช้หน่วยงาน "${name}" อีกครั้งแล้ว` }
        : { ok: false, message: "มีหน่วยงานชื่อนี้อยู่แล้ว" };
    }
    if (error) return { ok: false, message: "เพิ่มไม่สำเร็จ" };
    revalidatePath("/dashboard/places");
    return { ok: true, message: `เพิ่มหน่วยงาน "${name}" แล้ว` };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

// หน่วยงานที่มีใบแจ้งเดิมอ้างอิงอยู่ลบไม่ได้ (ประวัติจะหาย) จึงซ่อนจากหน้าแจ้งซ่อมแทน
export async function deleteBuilding(buildingId: string): Promise<PlaceState> {
  try {
    const supabase = await requireStaff();
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId);
    if ((count ?? 0) > 0) {
      const { error } = await supabase
        .from("buildings")
        .update({ active: false })
        .eq("id", buildingId);
      if (error) return { ok: false, message: "ลบไม่สำเร็จ" };
      revalidatePath("/dashboard/places");
      return { ok: true, message: "นำออกจากหน้าแจ้งซ่อมแล้ว ใบแจ้งเดิมของหน่วยงานนี้ยังอยู่ครบ" };
    }
    await supabase.from("rooms").delete().eq("building_id", buildingId);
    const { error } = await supabase.from("buildings").delete().eq("id", buildingId);
    if (error) return { ok: false, message: "ลบไม่สำเร็จ" };
    revalidatePath("/dashboard/places");
    return { ok: true, message: "ลบแล้ว" };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

export async function addTechnician(_prev: PlaceState, formData: FormData): Promise<PlaceState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 100) {
    return { ok: false, message: "ชื่อผู้รับผิดชอบต้องยาว 1-100 ตัวอักษร" };
  }
  try {
    const supabase = await requireStaff();
    const { data: last } = await supabase
      .from("technicians")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("technicians")
      .insert({ name, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) {
      return { ok: false, message: error.code === "23505" ? "มีชื่อนี้อยู่แล้ว" : "เพิ่มไม่สำเร็จ" };
    }
    revalidatePath("/dashboard/places");
    return { ok: true, message: `เพิ่ม "${name}" แล้ว` };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}

// ใบแจ้งที่เคยมอบหมายให้คนนี้จะกลายเป็น "ยังไม่มอบหมาย" (on delete set null)
export async function deleteTechnician(technicianId: string): Promise<PlaceState> {
  try {
    const supabase = await requireStaff();
    const { error } = await supabase.from("technicians").delete().eq("id", technicianId);
    if (error) return { ok: false, message: "ลบไม่สำเร็จ" };
    revalidatePath("/dashboard/places");
    return { ok: true, message: "ลบแล้ว" };
  } catch {
    return { ok: false, message: "ไม่มีสิทธิ์ทำรายการนี้" };
  }
}
