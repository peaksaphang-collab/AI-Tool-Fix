"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assignReport, updateReportStatus } from "@/app/dashboard/actions";
import { ReportCard } from "@/components/dashboard/report-card";
import type { Database, ReportStatus, Urgency } from "@/lib/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];
type Staff = Database["public"]["Tables"]["staff"]["Row"];

export interface ReportWithLocation extends Report {
  buildingName: string;
  roomName: string;
  roomFloor: string | null;
  serviceTypeName: string | null;
  assignedName: string | null;
}

const URGENCY_ORDER: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function byUrgencyThenNewest(a: ReportWithLocation, b: ReportWithLocation) {
  const ua = a.urgency ? URGENCY_ORDER[a.urgency] : 4;
  const ub = b.urgency ? URGENCY_ORDER[b.urgency] : 4;
  if (ua !== ub) return ua - ub;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function DashboardClient({
  initialReports,
  buildings,
  rooms,
  serviceTypes,
  staff,
}: {
  initialReports: ReportWithLocation[];
  buildings: Building[];
  rooms: Room[];
  serviceTypes: ServiceType[];
  staff: Staff[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const buildingNameById = useMemo(
    () => new Map(buildings.map((b) => [b.id, b.name])),
    [buildings]
  );
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const serviceTypeById = useMemo(
    () => new Map(serviceTypes.map((t) => [t.id, t.name])),
    [serviceTypes]
  );
  const staffById = useMemo(
    () => new Map(staff.map((s) => [s.id, s.full_name])),
    [staff]
  );

  const enrich = useMemo(
    () =>
      (report: Report): ReportWithLocation => ({
        ...report,
        buildingName: buildingNameById.get(report.building_id) ?? "ไม่ทราบอาคาร",
        roomName: roomById.get(report.room_id)?.name ?? "ไม่ทราบห้อง",
        roomFloor: roomById.get(report.room_id)?.floor ?? null,
        serviceTypeName: report.service_type_id
          ? serviceTypeById.get(report.service_type_id) ?? null
          : null,
        assignedName: report.assigned_to
          ? staffById.get(report.assigned_to) ?? null
          : null,
      }),
    [buildingNameById, roomById, serviceTypeById, staffById]
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const report = enrich(payload.new as Report);
          setReports((current) => [report, ...current]);
          // Client requirement: automatic alert when a new report arrives.
          toast.warning(`มีแจ้งซ่อมใหม่: ${report.buildingName} · ${report.roomName}`, {
            description: report.ai_equipment_type ?? undefined,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const updated = enrich(payload.new as Report);
          setReports((current) =>
            current.map((report) => (report.id === updated.id ? updated : report))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enrich]);

  function handleStatusChange(id: string, status: ReportStatus) {
    // Optimistic update — the realtime subscription reconciles the final state.
    setReports((current) =>
      current.map((report) => (report.id === id ? { ...report, status } : report))
    );
    startTransition(() => {
      updateReportStatus(id, status).catch(() => {
        setReports(initialReports);
      });
    });
  }

  function handleAssign(id: string, staffId: string | null) {
    setReports((current) =>
      current.map((report) =>
        report.id === id
          ? {
              ...report,
              assigned_to: staffId,
              assignedName: staffId ? staffById.get(staffId) ?? null : null,
            }
          : report
      )
    );
    startTransition(() => {
      assignReport(id, staffId).catch(() => {
        setReports(initialReports);
      });
    });
  }

  // Two sides per the client requirement: open work vs. closed work.
  // "cannot_proceed" is closed-but-not-fixed, shown with its own badge.
  const q = query.trim().toLowerCase();
  const visible = q
    ? reports.filter((r) =>
        [
          r.buildingName,
          r.roomName,
          r.serviceTypeName,
          r.ai_equipment_type,
          r.ai_description,
          r.reporter_name,
          r.contact_phone,
          r.assignedName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : reports;

  const open = visible
    .filter((r) => r.status === "pending" || r.status === "in_progress")
    .sort(byUrgencyThenNewest);
  const closed = visible.filter(
    (r) => r.status === "done" || r.status === "cannot_proceed"
  );

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา อาคาร / ห้อง / อุปกรณ์ / ผู้แจ้ง / เบอร์โทร"
          aria-label="ค้นหารายการแจ้งซ่อม"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:max-w-md"
        />
        {q && (
          <p className="mt-1 text-xs text-muted-foreground">
            พบ {visible.length} รายการจากทั้งหมด {reports.length}
          </p>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-amber-600">ยังไม่เสร็จ ({open.length})</h2>
        <div className="flex flex-col gap-2">
          {open.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              staff={staff}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
            />
          ))}
          {open.length === 0 && (
            <p className="text-sm text-muted-foreground">ไม่มีรายการค้างอยู่</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-emerald-600">จบงานแล้ว ({closed.length})</h2>
        <div className="flex flex-col gap-2">
          {closed.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              staff={staff}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
            />
          ))}
          {closed.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีรายการที่จบงาน</p>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
