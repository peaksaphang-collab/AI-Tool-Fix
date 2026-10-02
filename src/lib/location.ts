import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

// ใบใหม่เก็บห้อง/จุดที่ผู้แจ้งพิมพ์เอง (location_detail) ส่วนใบเก่าอ้างห้องในตาราง rooms
export function locationOf(
  report: { room_id: string | null; location_detail: string | null },
  roomById: Map<string, Room>
): { name: string; floor: string | null } {
  const typed = report.location_detail?.trim();
  if (typed) return { name: typed, floor: null };
  const room = report.room_id ? roomById.get(report.room_id) : undefined;
  return { name: room?.name ?? "ไม่ระบุห้อง", floor: room?.floor ?? null };
}
