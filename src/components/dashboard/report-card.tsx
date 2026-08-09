"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { CheckCircle2, RotateCcw, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSignedPhotoUrl } from "@/app/dashboard/actions";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";

const STATUS_LABEL: Record<ReportWithLocation["status"], string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
  done: "เสร็จแล้ว",
};

export function ReportCard({
  report,
  onStatusChange,
}: {
  report: ReportWithLocation;
  onStatusChange: (id: string, status: ReportWithLocation["status"]) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedPhotoUrl(report.photo_path).then((url) => {
      if (!cancelled) setPhotoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [report.photo_path]);

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="รูปที่แจ้งซ่อม" className="size-full object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">
            {report.buildingName} · {report.roomName}
          </p>
          <Badge variant="outline">{STATUS_LABEL[report.status]}</Badge>
        </div>
        {report.ai_equipment_type && (
          <p className="text-sm">
            <span className="font-medium">{report.ai_equipment_type}</span>
            {report.ai_description ? ` — ${report.ai_description}` : ""}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          แจ้งเมื่อ {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: th })}
          {report.reporter_name ? ` · โดย ${report.reporter_name}` : ""}
        </p>
        <div className="mt-1 flex gap-2">
          {report.status !== "done" ? (
            <>
              {report.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(report.id, "in_progress")}
                >
                  <RotateCcw /> เริ่มซ่อม
                </Button>
              )}
              <Button size="sm" onClick={() => onStatusChange(report.id, "done")}>
                <CheckCircle2 /> ซ่อมเสร็จแล้ว
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(report.id, "pending")}
            >
              <Undo2 /> เปิดใหม่
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
