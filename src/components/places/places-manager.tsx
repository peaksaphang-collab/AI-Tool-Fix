"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Building2, DoorClosed, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  addBuilding,
  addRoom,
  deleteBuilding,
  deleteRoom,
  type PlaceState,
} from "@/app/dashboard/places/actions";
import type { Database } from "@/lib/supabase/types";

type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

const initial: PlaceState = { ok: false };

export function PlacesManager({
  buildings,
  rooms,
}: {
  buildings: Building[];
  rooms: Room[];
}) {
  const [selected, setSelected] = useState<string>(buildings[0]?.id ?? "");
  const [, startTransition] = useTransition();

  const [bState, addBuildingAction, bPending] = useActionState(addBuilding, initial);
  const [rState, addRoomAction, rPending] = useActionState(addRoom, initial);

  // แสดง toast เมื่อผลลัพธ์ของ action เปลี่ยน (ไม่ใช่ตอนกด submit ที่ state ยังเก่า)
  const seenB = useRef(bState);
  const seenR = useRef(rState);
  useEffect(() => {
    if (bState !== seenB.current) {
      seenB.current = bState;
      if (bState.message) (bState.ok ? toast.success : toast.error)(bState.message);
    }
  }, [bState]);
  useEffect(() => {
    if (rState !== seenR.current) {
      seenR.current = rState;
      if (rState.message) (rState.ok ? toast.success : toast.error)(rState.message);
    }
  }, [rState]);

  const buildingItems = Object.fromEntries(buildings.map((b) => [b.id, b.name]));
  const roomsOfSelected = rooms.filter((r) => r.building_id === selected);
  const roomCount = (bid: string) => rooms.filter((r) => r.building_id === bid).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── อาคาร ── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <Building2 className="size-4 text-primary" /> อาคาร ({buildings.length})
        </h2>

        <form action={addBuildingAction} className="flex gap-2">
          <Input name="name" placeholder="ชื่ออาคารใหม่" maxLength={120} required />
          <Button type="submit" disabled={bPending}>
            {bPending ? <Loader2 className="animate-spin" /> : <Plus />} เพิ่ม
          </Button>
        </form>

        <div className="flex flex-col divide-y rounded-lg border">
          {buildings.map((b) => (
            <div key={b.id} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 truncate text-sm">{b.name}</span>
              <span className="text-xs text-muted-foreground">{roomCount(b.id)} ห้อง</span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`ลบ ${b.name}`}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteBuilding(b.id);
                    if (res.ok) toast.success(`ลบอาคาร "${b.name}" แล้ว`);
                    else toast.error(res.message ?? "ลบไม่สำเร็จ");
                  })
                }
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          {buildings.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">ยังไม่มีอาคาร</p>
          )}
        </div>
      </section>

      {/* ── ห้อง ── */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <DoorClosed className="size-4 text-primary" /> ห้องในอาคาร
        </h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="buildingPick">เลือกอาคาร</Label>
          <Select
            items={buildingItems}
            value={selected}
            onValueChange={(v) => setSelected(v ?? "")}
          >
            <SelectTrigger id="buildingPick" className="w-full">
              <SelectValue placeholder="เลือกอาคาร" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form
          action={(fd) => {
            fd.set("buildingId", selected);
            addRoomAction(fd);
          }}
          className="flex gap-2"
        >
          <Input name="name" placeholder="ชื่อห้อง / เลขห้อง" maxLength={120} required />
          <Input name="floor" placeholder="ชั้น" className="w-20" maxLength={12} />
          <Button type="submit" disabled={rPending || !selected}>
            {rPending ? <Loader2 className="animate-spin" /> : <Plus />} เพิ่ม
          </Button>
        </form>

        <div className="flex flex-col divide-y rounded-lg border">
          {roomsOfSelected.map((r) => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 truncate text-sm">
                {r.name}
                {r.floor ? <span className="text-muted-foreground"> · ชั้น {r.floor}</span> : null}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`ลบ ${r.name}`}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteRoom(r.id);
                    if (res.ok) toast.success(`ลบห้อง "${r.name}" แล้ว`);
                    else toast.error(res.message ?? "ลบไม่สำเร็จ");
                  })
                }
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          {selected && roomsOfSelected.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">อาคารนี้ยังไม่มีห้อง</p>
          )}
          {!selected && (
            <p className="px-3 py-4 text-sm text-muted-foreground">เลือกอาคารก่อน</p>
          )}
        </div>
      </section>
    </div>
  );
}
