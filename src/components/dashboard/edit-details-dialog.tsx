"use client";

import { useState, useTransition } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReportDetails } from "@/app/dashboard/details-action";
import type { Database, Urgency } from "@/lib/supabase/types";

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];

const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "critical", label: "วิกฤต" },
  { value: "high", label: "ด่วน" },
  { value: "medium", label: "ปานกลาง" },
  { value: "low", label: "ไม่เร่งด่วน" },
];

export function EditDetailsDialog({
  reportId,
  title,
  serviceTypes,
  currentServiceTypeId,
  currentUrgency,
  currentEquipment,
}: {
  reportId: string;
  title: string;
  serviceTypes: ServiceType[];
  currentServiceTypeId: number | null;
  currentUrgency: Urgency | null;
  currentEquipment: string | null;
}) {
  const [equipment, setEquipment] = useState(currentEquipment ?? "");
  const [serviceTypeId, setServiceTypeId] = useState(
    currentServiceTypeId ? String(currentServiceTypeId) : "none"
  );
  const [urgency, setUrgency] = useState<string>(currentUrgency ?? "none");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateReportDetails(reportId, {
          serviceTypeId: serviceTypeId === "none" ? null : Number(serviceTypeId),
          urgency: urgency === "none" ? null : (urgency as Urgency),
          equipment: equipment || null,
        });
        toast.success("บันทึกรายละเอียดแล้ว");
        setOpen(false);
      } catch {
        toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="ghost" className="press" />}
      >
        <PencilLine /> แก้รายละเอียด
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้รายละเอียดงานซ่อม</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`eq-${reportId}`}>อุปกรณ์ / อาการเสีย</Label>
            <Input
              id={`eq-${reportId}`}
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              maxLength={100}
              placeholder="เช่น แอร์ไม่เย็น, หลอดไฟขาด"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>ประเภทงานซ่อม</Label>
            <Select
              value={serviceTypeId}
              onValueChange={(v) => setServiceTypeId(v ?? "none")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ยังไม่ระบุ</SelectItem>
                {serviceTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>ความด่วน</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ยังไม่ระบุ</SelectItem>
                {URGENCY_OPTIONS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>ยกเลิก</DialogClose>
          <Button onClick={save} disabled={pending} className="press">
            {pending && <Loader2 className="animate-spin" />} บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
