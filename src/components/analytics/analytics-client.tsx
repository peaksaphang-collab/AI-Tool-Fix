"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateReportStatus } from "@/app/dashboard/actions";
import { BreakdownList } from "@/components/analytics/breakdown-list";
import { KpiCards } from "@/components/analytics/kpi-cards";
import { PeriodSummary } from "@/components/analytics/period-summary";
import { ProgressRing } from "@/components/analytics/progress-ring";
import { KanbanBoard } from "@/components/analytics/kanban-board";
import { Timeline, type TimelineEvent } from "@/components/analytics/timeline";
import { Heatmap } from "@/components/analytics/heatmap";
import { CalendarView } from "@/components/analytics/calendar-view";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";
import type { ReportStatus } from "@/lib/supabase/types";

export function AnalyticsClient({
  reports,
  timelineEvents,
}: {
  reports: ReportWithLocation[];
  timelineEvents: TimelineEvent[];
}) {
  const [items, setItems] = useState(reports);
  const [, startTransition] = useTransition();

  const total = items.length;
  const pending = items.filter((r) => r.status === "pending").length;
  const inProgress = items.filter((r) => r.status === "in_progress").length;
  const done = items.filter((r) => r.status === "done").length;
  const cannotProceed = items.filter((r) => r.status === "cannot_proceed").length;

  const byServiceType = Object.values(
    items.reduce<Record<string, { label: string; total: number; done: number }>>(
      (acc, r) => {
        const label = r.serviceTypeName ?? "ยังไม่จัดประเภท";
        acc[label] ??= { label, total: 0, done: 0 };
        acc[label].total += 1;
        if (r.status === "done") acc[label].done += 1;
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.total - a.total);

  const byAssignee = Object.values(
    items.reduce<Record<string, { label: string; total: number; done: number }>>(
      (acc, r) => {
        const label = r.assignedName ?? "ยังไม่มอบหมาย";
        acc[label] ??= { label, total: 0, done: 0 };
        acc[label].total += 1;
        if (r.status === "done") acc[label].done += 1;
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.total - a.total);

  const resolutionHours = items
    .filter((r) => r.status === "done" && r.resolved_at)
    .map((r) => (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / 3_600_000);
  const avgResolutionHours =
    resolutionHours.length > 0
      ? resolutionHours.reduce((sum, h) => sum + h, 0) / resolutionHours.length
      : null;

  function handleStatusChange(id: string, status: ReportStatus) {
    setItems((current) =>
      current.map((report) => (report.id === id ? { ...report, status } : report))
    );
    startTransition(() => {
      updateReportStatus(id, status).catch(() => {
        setItems(reports);
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <KpiCards
          total={total}
          pending={pending}
          inProgress={inProgress}
          done={done}
          cannotProceed={cannotProceed}
          avgResolutionHours={avgResolutionHours}
        />
        <ProgressRing
          percent={total === 0 ? 0 : (done / total) * 100}
          label="อัตราซ่อมเสร็จ"
        />
      </div>

      <PeriodSummary reports={items} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownList title="รายงานตามประเภทการให้บริการ" rows={byServiceType} />
        <BreakdownList title="รายงานผลแต่ละคน (ผู้รับผิดชอบ)" rows={byAssignee} />
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="pt-4">
          <KanbanBoard reports={items} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="timeline" className="pt-4">
          <Timeline events={timelineEvents} />
        </TabsContent>
        <TabsContent value="heatmap" className="pt-4">
          <Heatmap timestamps={items.map((r) => r.created_at)} />
        </TabsContent>
        <TabsContent value="calendar" className="pt-4">
          <CalendarView timestamps={items.map((r) => r.created_at)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
