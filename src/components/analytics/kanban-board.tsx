"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/lib/supabase/types";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";

const COLUMNS: { status: ReportStatus; label: string }[] = [
  { status: "pending", label: "รอดำเนินการ" },
  { status: "in_progress", label: "กำลังซ่อม" },
  { status: "done", label: "เสร็จแล้ว" },
];

function KanbanCard({ report }: { report: ReportWithLocation }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: report.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className="cursor-grab touch-none rounded-md border bg-card p-2 text-sm shadow-sm active:cursor-grabbing"
      data-dragging={isDragging}
    >
      <p className="font-medium">
        {report.buildingName} · {report.roomName}
      </p>
      {report.ai_equipment_type && (
        <Badge variant="outline" className="mt-1">
          {report.ai_equipment_type}
        </Badge>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  reports,
}: {
  status: ReportStatus;
  label: string;
  reports: ReportWithLocation[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-40 flex-col gap-2 rounded-lg border p-3 ${
        isOver ? "bg-muted" : "bg-muted/30"
      }`}
    >
      <p className="text-sm font-medium">
        {label} ({reports.length})
      </p>
      <div className="flex flex-col gap-2">
        {reports.map((report) => (
          <KanbanCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  reports,
  onStatusChange,
}: {
  reports: ReportWithLocation[];
  onStatusChange: (id: string, status: ReportStatus) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    onStatusChange(active.id as string, over.id as ReportStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-3 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            reports={reports.filter((report) => report.status === column.status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
