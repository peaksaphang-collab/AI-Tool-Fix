"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Ban, CheckCircle2, Phone, RotateCcw, Undo2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSignedPhotoUrl } from "@/app/dashboard/actions";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";
import type { Database, Urgency } from "@/lib/supabase/types";

type Staff = Database["public"]["Tables"]["staff"]["Row"];

const STATUS_LABEL: Record<ReportWithLocation["status"], string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
  done: "เสร็จแล้ว",
  cannot_proceed: "ดำเนินการไม่ได้",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "วิกฤต",
  high: "ด่วน",
  medium: "ปานกลาง",
  low: "ไม่เร่งด่วน",
};

const URGENCY_CLASS: Record<Urgency, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-400 text-black",
  low: "bg-slate-300 text-slate-800",
};

const OVERDUE_MS = 24 * 60 * 60 * 1000;

export function ReportCard({
  report,
  staff,
  onStatusChange,
  onAssign,
}: {
  report: ReportWithLocation;
  staff: Staff[];
  onStatusChange: (id: string, status: ReportWithLocation["status"]) => void;
  onAssign: (id: string, staffId: string | null) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    getSignedPhotoUrl(report.photo_path).then((url) => {
      if (!cancelled) setPhotoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [report.photo_path]);

  const isOpen = report.status === "pending" || report.status === "in_progress";

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
          <div className="flex shrink-0 gap-1">
            {report.urgency && (
              <Badge className={URGENCY_CLASS[report.urgency]}>
                {URGENCY_LABEL[report.urgency]}
              </Badge>
            )}
            {isOpen && now - new Date(report.created_at).getTime() > OVERDUE_MS && (
              <Badge variant="destructive">ค้างนาน</Badge>
            )}
            <Badge variant="outline">{STATUS_LABEL[report.status]}</Badge>
          </div>
        </div>
        {report.ai_equipment_type && (
          <p className="text-sm">
            <span className="font-medium">{report.ai_equipment_type}</span>
            {report.ai_description ? ` — ${report.ai_description}` : ""}
          </p>
        )}
        {report.serviceTypeName && (
          <p className="text-xs text-muted-foreground">{report.serviceTypeName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          แจ้งเมื่อ {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: th })}
          {report.reporter_name ? ` · โดย ${report.reporter_name}` : ""}
          {report.contact_phone ? (
            <span className="ml-1 inline-flex items-center gap-0.5">
              <Phone className="size-3" /> {report.contact_phone}
            </span>
          ) : null}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {isOpen ? (
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
              <Button
                size="sm"
                onClick={() => {
                  onStatusChange(report.id, "done");
                  toast.success(`ปิดงาน ${report.buildingName} · ${report.roomName} เรียบร้อย`);
                }}
              >
                <CheckCircle2 /> ซ่อมเสร็จแล้ว
              </Button>
              <Dialog>
                <DialogTrigger render={<Button size="sm" variant="destructive" />}>
                  <Ban /> ดำเนินการไม่ได้
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>ยืนยันปิดงานเป็น &quot;ดำเนินการไม่ได้&quot;?</DialogTitle>
                    <DialogDescription>
                      {report.buildingName} · {report.roomName} จะถูกย้ายไปฝั่งจบงาน
                      โดยไม่นับเป็นงานที่ซ่อมสำเร็จ (เปิดงานกลับมาใหม่ได้ภายหลัง)
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      ยกเลิก
                    </DialogClose>
                    <DialogClose
                      render={
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onStatusChange(report.id, "cannot_proceed");
                            toast.info("บันทึกสถานะ ดำเนินการไม่ได้ แล้ว");
                          }}
                        />
                      }
                    >
                      ยืนยัน
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(report.id, "pending")}
            >
              <Undo2 /> เปิดงานใหม่
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <UserRound className="size-3.5 text-muted-foreground" />
            <Select
              value={report.assigned_to ?? "none"}
              onValueChange={(value) =>
                onAssign(report.id, value === "none" || !value ? null : value)
              }
            >
              <SelectTrigger size="sm" className="h-7 min-w-32 text-xs">
                <SelectValue placeholder="ผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ยังไม่มอบหมาย</SelectItem>
                {staff.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
