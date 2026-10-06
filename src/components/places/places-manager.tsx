"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Building2, Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBuilding,
  addTechnician,
  deleteBuilding,
  deleteTechnician,
  type PlaceState,
} from "@/app/dashboard/places/actions";
import type { Database } from "@/lib/supabase/types";

type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Technician = { id: string; name: string };

const initial: PlaceState = { ok: false };

function useResultToast(state: PlaceState) {
  // แสดง toast เมื่อผลลัพธ์ของ action เปลี่ยน (ไม่ใช่ตอนกด submit ที่ state ยังเก่า)
  const seen = useRef(state);
  useEffect(() => {
    if (state !== seen.current) {
      seen.current = state;
      if (state.message) (state.ok ? toast.success : toast.error)(state.message);
    }
  }, [state]);
}

export function PlacesManager({
  buildings,
  technicians,
}: {
  buildings: Building[];
  technicians: Technician[];
}) {
  const [, startTransition] = useTransition();
  const [bState, addBuildingAction, bPending] = useActionState(addBuilding, initial);
  const [tState, addTechnicianAction, tPending] = useActionState(addTechnician, initial);
  useResultToast(bState);
  useResultToast(tState);

  function remove(run: () => Promise<PlaceState>) {
    startTransition(async () => {
      const res = await run();
      (res.ok ? toast.success : toast.error)(res.message ?? (res.ok ? "ลบแล้ว" : "ลบไม่สำเร็จ"));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <Building2 className="size-4 text-primary" /> หน่วยงาน ({buildings.length})
        </h2>

        <form action={addBuildingAction} className="flex gap-2">
          <Input name="name" placeholder="ชื่อหน่วยงานใหม่" maxLength={120} required />
          <Button type="submit" disabled={bPending}>
            {bPending ? <Loader2 className="animate-spin" /> : <Plus />} เพิ่ม
          </Button>
        </form>

        <div className="flex flex-col divide-y rounded-lg border">
          {buildings.map((b) => (
            <div key={b.id} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 truncate text-sm">{b.name}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`ลบ ${b.name}`}
                onClick={() => remove(() => deleteBuilding(b.id))}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          {buildings.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">ยังไม่มีหน่วยงาน</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <UserRound className="size-4 text-primary" /> ผู้รับผิดชอบงาน ({technicians.length})
        </h2>

        <form action={addTechnicianAction} className="flex gap-2">
          <Input name="name" placeholder="ชื่อผู้รับผิดชอบใหม่" maxLength={100} required />
          <Button type="submit" disabled={tPending}>
            {tPending ? <Loader2 className="animate-spin" /> : <Plus />} เพิ่ม
          </Button>
        </form>

        <div className="flex flex-col divide-y rounded-lg border">
          {technicians.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 truncate text-sm">{t.name}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`ลบ ${t.name}`}
                onClick={() => remove(() => deleteTechnician(t.id))}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          {technicians.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">ยังไม่มีรายชื่อ</p>
          )}
        </div>
      </section>
    </div>
  );
}
