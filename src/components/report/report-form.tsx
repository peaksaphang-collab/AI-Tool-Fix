"use client";

import { useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReport, type SubmitReportState } from "@/app/report/actions";
import type { Database } from "@/lib/supabase/types";

type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];

const initialState: SubmitReportState = { status: "idle" };

export function ReportForm({
  buildings,
  rooms,
  serviceTypes,
}: {
  buildings: Building[];
  rooms: Room[];
  serviceTypes: ServiceType[];
}) {
  const [state, formAction, pending] = useActionState(submitReport, initialState);
  const [buildingId, setBuildingId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const roomsForBuilding = useMemo(
    () => rooms.filter((room) => room.building_id === buildingId),
    [rooms, buildingId]
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <p className="text-lg font-medium">{state.message}</p>
        <Button
          variant="outline"
          onClick={() => {
            formRef.current?.reset();
            setPreview(null);
            setBuildingId("");
            window.location.reload();
          }}
        >
          แจ้งซ่อมรายการใหม่
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="photo">ถ่ายรูปสิ่งที่เสีย</Label>
        <label
          htmlFor="photo"
          className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground hover:bg-muted/60"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="ตัวอย่างรูปที่แจ้ง" className="size-full rounded-lg object-cover" />
          ) : (
            <>
              <Camera className="size-8" />
              <span className="text-sm">แตะเพื่อถ่ายรูปหรือเลือกรูปภาพ</span>
            </>
          )}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          required
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="buildingId">อาคาร</Label>
        <Select
          name="buildingId"
          value={buildingId}
          onValueChange={(value) => setBuildingId(value ?? "")}
          required
        >
          <SelectTrigger id="buildingId" className="w-full">
            <SelectValue placeholder="เลือกอาคาร" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="roomId">ห้อง</Label>
        <Select name="roomId" disabled={!buildingId} required>
          <SelectTrigger id="roomId" className="w-full">
            <SelectValue placeholder={buildingId ? "เลือกห้อง" : "เลือกอาคารก่อน"} />
          </SelectTrigger>
          <SelectContent>
            {roomsForBuilding.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
                {room.floor ? ` (ชั้น ${room.floor})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="serviceTypeId">ประเภทงานซ่อม (ไม่บังคับ)</Label>
        <Select name="serviceTypeId">
          <SelectTrigger id="serviceTypeId" className="w-full">
            <SelectValue placeholder="ไม่เลือกก็ได้ — AI วิเคราะห์ให้อัตโนมัติ" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reporterName">ชื่อผู้แจ้ง (ไม่บังคับ)</Label>
          <Input id="reporterName" name="reporterName" placeholder="ไม่ระบุก็ได้" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactPhone">เบอร์ติดต่อ (ไม่บังคับ)</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            placeholder="เผื่อช่างติดต่อกลับ"
          />
        </div>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? (
          <>
            <Loader2 className="animate-spin" /> กำลังส่ง...
          </>
        ) : (
          "แจ้งซ่อม"
        )}
      </Button>
    </form>
  );
}
