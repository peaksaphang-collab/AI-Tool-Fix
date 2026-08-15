"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Ban,
  CheckCircle2,
  ImageOff,
  Phone,
  RotateCcw,
  Timer,
  Undo2,
  UserRound,
} from "lucide-react";
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
import { EditDetailsDialog } from "@/components/dashboard/edit-details-dialog";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";
import type { Database, Urgency } from "@/lib/supabase/types";
import { SLA_LABEL, slaInfo } from "@/lib/sla";

type Staff = Database["public"]["Tables"]["staff"]["Row"];
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];

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


export function ReportCard({
  report,
  staff,
  serviceTypes,
  onStatusChange,
  onAssign,
}: {
  report: ReportWithLocation;
  staff: Staff[];
  serviceTypes: ServiceType[];
  onStatusChange: (id: string, status: ReportWithLocation["status"]) => void;
  onAssign: (id: string, staffId: string | null) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBroken, setPhotoBroken] = useState(false);
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
  const sla = slaInfo(report, now);
  const createdAt = new Date(report.created_at);
  const exactTime = format(createdAt, "d MMM yyyy HH:mm น.", { locale: th });
  const showPhoto = Boolean(photoUrl) && !photoBroken;

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* รูป: กดเพื่อดูขนาดเต็ม / มี fallback เมื่อรูปเสียหรือยังโหลดไม่เสร็จ */}
      <Dialog>
        <DialogTrigger
          render={
            <button
              type="button"
              disabled={!showPhoto}
              aria-label={showPhoto ? "ดูรูปขนาดเต็ม" : "ไม่มีรูป"}
              className="size-20 shrink-0 overflow-hidden rounded-md border bg-muted disabled:cursor-default sm:size-24"
            />
          }
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl!}
              alt="รูปที่แจ้งซ่อม"
              onError={() => setPhotoBroken(true)}
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="size-5" />
              <span className="text-[10px] leading-tight">
                {photoUrl ? "รูปเสียหาย" : "กำลังโหลด"}
              </span>
            </span>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {report.buildingName} · {report.roomName}
            </DialogTitle>
            <DialogDescription>แจ้งเมื่อ {exactTime}</DialogDescription>
          </DialogHeader>
          {showPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl!}
              alt="รูปที่แจ้งซ่อม"
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p className="min-w-0 flex-1 truncate font-medium">
            {report.buildingName} · {report.roomName}
          </p>
          <div className="flex shrink-0 flex-wrap gap-1">
            {report.urgency && (
              <Badge className={URGENCY_CLASS[report.urgency]}>
                {URGENCY_LABEL[report.urgency]}
              </Badge>
            )}
            {(sla.state === "warning" || sla.state === "breached") && (
              <Badge
                variant={sla.state === "breached" ? "destructive" : "outline"}
                className={sla.state === "warning" ? "border-amber-500 text-amber-700" : ""}
                title={`SLA ${SLA_LABEL[report.urgency ?? "medium"]} · ครบกำหนด ${sla.deadline.toLocaleString("th-TH")}`}
              >
                <Timer className="size-3" /> {sla.label}
              </Badge>
            )}
            {sla.state === "missed" && (
              <Badge variant="outline" className="border-red-300 text-red-700">
                {sla.label}
              </Badge>
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
          <span title={exactTime}>
            แจ้งเมื่อ{" "}
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: th })}
          </span>
          {report.reporter_name ? ` · โดย ${report.reporter_name}` : ""}
          {report.contact_phone ? (
            <a
              href={`tel:${report.contact_phone.replace(/[^0-9+]/g, "")}`}
              className="ml-1 inline-flex items-center gap-0.5 font-medium text-primary underline-offset-2 hover:underline"
            >
              <Phone className="size-3" /> {report.contact_phone}
            </a>
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
                  toast.success(
                    `ปิดงาน ${report.buildingName} · ${report.roomName} เรียบร้อย`
                  );
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
                    <DialogTitle>
                      ยืนยันปิดงานเป็น &quot;ดำเนินการไม่ได้&quot;?
                    </DialogTitle>
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
          <EditDetailsDialog
            reportId={report.id}
            title={`${report.buildingName} · ${report.roomName}`}
            serviceTypes={serviceTypes}
            currentServiceTypeId={report.service_type_id}
            currentUrgency={report.urgency}
            currentEquipment={report.ai_equipment_type}
          />
          <div className="ml-auto flex items-center gap-1">
            <UserRound className="size-3.5 text-muted-foreground" />
            <Select
              value={report.assigned_to ?? "none"}
              onValueChange={(value) =>
                onAssign(report.id, value === "none" || !value ? null : value)
              }
            >
              <SelectTrigger size="sm" className="h-7 min-w-32 text-xs">
                <SelectValue>{report.assignedName ?? "ยังไม่มอบหมาย"}</SelectValue>
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
