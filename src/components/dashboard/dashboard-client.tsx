"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateReportStatus } from "@/app/dashboard/actions";
import { ReportCard } from "@/components/dashboard/report-card";
import type { Database, ReportStatus } from "@/lib/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

export interface ReportWithLocation extends Report {
  buildingName: string;
  roomName: string;
  roomFloor: string | null;
}

export function DashboardClient({
  initialReports,
  buildings,
  rooms,
}: {
  initialReports: ReportWithLocation[];
  buildings: Building[];
  rooms: Room[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [, startTransition] = useTransition();

  const buildingNameById = useMemo(
    () => new Map(buildings.map((b) => [b.id, b.name])),
    [buildings]
  );
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const enrich = useMemo(
    () =>
      (report: Report): ReportWithLocation => ({
        ...report,
        buildingName: buildingNameById.get(report.building_id) ?? "ไม่ทราบอาคาร",
        roomName: roomById.get(report.room_id)?.name ?? "ไม่ทราบห้อง",
        roomFloor: roomById.get(report.room_id)?.floor ?? null,
      }),
    [buildingNameById, roomById]
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          setReports((current) => [enrich(payload.new as Report), ...current]);
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

  const notDone = reports.filter((r) => r.status !== "done");
  const done = reports.filter((r) => r.status === "done");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-amber-600">ยังไม่เสร็จ ({notDone.length})</h2>
        <div className="flex flex-col gap-2">
          {notDone.map((report) => (
            <ReportCard key={report.id} report={report} onStatusChange={handleStatusChange} />
          ))}
          {notDone.length === 0 && (
            <p className="text-sm text-muted-foreground">ไม่มีรายการค้างอยู่</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-emerald-600">เสร็จแล้ว ({done.length})</h2>
        <div className="flex flex-col gap-2">
          {done.map((report) => (
            <ReportCard key={report.id} report={report} onStatusChange={handleStatusChange} />
          ))}
          {done.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีรายการที่เสร็จ</p>
          )}
        </div>
      </section>
    </div>
  );
}
