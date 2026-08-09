import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient, type ReportWithLocation } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: reports }, { data: buildings }, { data: rooms }] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("buildings").select("*"),
    supabase.from("rooms").select("*"),
  ]);

  const buildingNameById = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));

  const reportsWithLocation: ReportWithLocation[] = (reports ?? []).map((report) => {
    const room = roomById.get(report.room_id);
    return {
      ...report,
      buildingName: buildingNameById.get(report.building_id) ?? "ไม่ทราบอาคาร",
      roomName: room?.name ?? "ไม่ทราบห้อง",
      roomFloor: room?.floor ?? null,
    };
  });

  return (
    <main className="min-h-dvh px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">แดชบอร์ดแจ้งซ่อม</h1>
      <DashboardClient
        initialReports={reportsWithLocation}
        buildings={buildings ?? []}
        rooms={rooms ?? []}
      />
    </main>
  );
}
