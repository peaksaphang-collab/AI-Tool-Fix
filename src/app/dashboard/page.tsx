import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient, type ReportWithLocation } from "@/components/dashboard/dashboard-client";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: reports },
    { data: buildings },
    { data: rooms },
    { data: serviceTypes },
    { data: staff },
  ] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("buildings").select("*"),
    supabase.from("rooms").select("*"),
    supabase.from("service_types").select("*").order("id"),
    supabase.from("staff").select("*").order("full_name"),
  ]);

  const buildingNameById = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));
  const serviceTypeById = new Map((serviceTypes ?? []).map((t) => [t.id, t.name]));
  const staffById = new Map((staff ?? []).map((s) => [s.id, s.full_name]));

  const reportsWithLocation: ReportWithLocation[] = (reports ?? []).map((report) => {
    const room = roomById.get(report.room_id);
    return {
      ...report,
      buildingName: buildingNameById.get(report.building_id) ?? "ไม่ทราบอาคาร",
      roomName: room?.name ?? "ไม่ทราบห้อง",
      roomFloor: room?.floor ?? null,
      serviceTypeName: report.service_type_id
        ? serviceTypeById.get(report.service_type_id) ?? null
        : null,
      assignedName: report.assigned_to
        ? staffById.get(report.assigned_to) ?? null
        : null,
    };
  });

  return (
    <main className="px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">แดชบอร์ดแจ้งซ่อม</h1>
      <DashboardClient
        initialReports={reportsWithLocation}
        buildings={buildings ?? []}
        rooms={rooms ?? []}
        serviceTypes={serviceTypes ?? []}
        staff={staff ?? []}
      />
    </main>
  );
}
