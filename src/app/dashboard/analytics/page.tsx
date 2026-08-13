import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";
import type { TimelineEvent } from "@/components/analytics/timeline";
import {
  ResearchMetricsPanel,
  type ResearchMetrics,
} from "@/components/analytics/research-metrics";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function AnalyticsPage() {
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
    { data: history },
    { data: serviceTypes },
    { data: staff },
  ] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("buildings").select("*"),
    supabase.from("rooms").select("*"),
    supabase
      .from("report_status_history")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(50),
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

  const reportById = new Map(reportsWithLocation.map((r) => [r.id, r]));

  const timelineEvents: TimelineEvent[] = (history ?? []).flatMap((event) => {
    const report = reportById.get(event.report_id);
    if (!report) return [];
    return [
      {
        id: event.id,
        reportId: event.report_id,
        status: event.status,
        changedAt: event.changed_at,
        buildingName: report.buildingName,
        roomName: report.roomName,
      },
    ];
  });

  // ยังไม่ได้รัน migration 0009 ก็ยังเปิดหน้านี้ได้ แค่แผงตัวชี้วัดจะบอกให้ไปรันก่อน
  const { data: metricsRows } = await supabase.rpc("research_metrics");
  const metrics = (metricsRows as ResearchMetrics[] | null)?.[0] ?? null;

  return (
    <main className="flex flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">แดชบอร์ดสรุปข้อมูล</h1>
      <ResearchMetricsPanel metrics={metrics} />
      <AnalyticsClient reports={reportsWithLocation} timelineEvents={timelineEvents} />
    </main>
  );
}
