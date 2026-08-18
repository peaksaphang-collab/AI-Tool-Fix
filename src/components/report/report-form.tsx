"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { Camera, Check, CheckCircle2, Copy, Loader2, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { compressImage } from "@/lib/compress-image";
import { DuplicateNotice } from "@/components/report/duplicate-notice";
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
  const [roomId, setRoomId] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // จับเวลาที่ผู้ใช้ใช้กรอกจริง — ข้อมูลวัดผล "ลดเวลาแจ้ง" ของงานวิจัย
  // ตั้งค่าใน effect เพราะ Date.now() เรียกตอน render ไม่ได้ (ผลไม่คงที่)
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // Base UI แสดงค่าดิบใน trigger ถ้าไม่บอก mapping value → ป้ายชื่อ
  // ไม่มี items ผู้ใช้จะเห็น UUID แทนชื่ออาคาร/ห้อง
  const buildingItems = useMemo(
    () => Object.fromEntries(buildings.map((b) => [b.id, b.name])),
    [buildings]
  );
  const roomItems = useMemo(
    () =>
      Object.fromEntries(
        rooms.map((r) => [r.id, r.floor ? `${r.name} (ชั้น ${r.floor})` : r.name])
      ),
    [rooms]
  );
  const serviceTypeItems = useMemo(
    () => Object.fromEntries(serviceTypes.map((t) => [String(t.id), t.name])),
    [serviceTypes]
  );

  const roomsForBuilding = useMemo(
    () => rooms.filter((room) => room.building_id === buildingId),
    [rooms, buildingId]
  );

  if (state.status === "success") {
    return (
      <div className="reveal glass flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <p className="text-lg font-medium">{state.message}</p>

        {state.trackingCode && (
          <div className="w-full space-y-2 rounded-xl bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">
              รหัสติดตามของคุณ — เก็บไว้เช็คสถานะได้ตลอด
            </p>
            <p className="select-all font-mono text-3xl font-bold tracking-[0.25em] text-primary">
              {state.trackingCode}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="press"
                onClick={() => {
                  navigator.clipboard?.writeText(state.trackingCode ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอกรหัส"}
              </Button>
              <a
                href={`/track?code=${state.trackingCode}`}
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "press",
                })}
              >
                <Search className="size-4" /> ติดตามสถานะ
              </a>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="press"
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
    <form
      ref={formRef}
      action={(fd) => {
        if (startedAtRef.current !== null) {
          fd.set(
            "elapsedSeconds",
            String(Math.round((Date.now() - startedAtRef.current) / 1000))
          );
        }
        return formAction(fd);
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="photo">ถ่ายรูปสิ่งที่เสีย</Label>
        <label
          htmlFor="photo"
          className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="ตัวอย่างรูปที่แจ้ง"
              className="size-full rounded-xl object-cover"
            />
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
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) {
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(file));
            // ย่อรูปก่อน แล้วสลับไฟล์ใน input เพื่อให้ FormData ส่งตัวที่เล็กแล้ว
            const compressed = await compressImage(file);
            if (compressed !== file) {
              const dt = new DataTransfer();
              dt.items.add(compressed);
              input.files = dt.files;
              setPreview(URL.createObjectURL(compressed));
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="buildingId">อาคาร</Label>
        <Select
          name="buildingId"
          items={buildingItems}
          value={buildingId}
          onValueChange={(value) => {
            setBuildingId(value ?? "");
            setRoomId("");
          }}
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
        <Select
          name="roomId"
          items={roomItems}
          value={roomId}
          onValueChange={(value) => setRoomId(value ?? "")}
          disabled={!buildingId}
          required
        >
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
        <DuplicateNotice roomId={roomId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="serviceTypeId">ประเภทงานซ่อม (ไม่บังคับ)</Label>
        <Select name="serviceTypeId" items={serviceTypeItems}>
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

      <Button type="submit" disabled={pending} size="lg" className="h-12 press">
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
