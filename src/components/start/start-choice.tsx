"use client";

import { useActionState, useState } from "react";
import { ArrowRight, GraduationCap, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  continueAsGuest,
  signInInternal,
  type StartState,
} from "@/app/start/actions";

const initialState: StartState = { status: "idle" };

export function StartChoice({ initial }: { initial: "internal" | null }) {
  const [mode, setMode] = useState<"internal" | null>(initial);
  const [state, formAction, pending] = useActionState(signInInternal, initialState);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setMode("internal")}
        aria-expanded={mode === "internal"}
        className={`press glass flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
          mode === "internal" ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
        }`}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">บุคลากรภายใน</span>
          <span className="block text-sm text-muted-foreground">
            นักศึกษา บุคลากร และผู้ใช้งานภายในมหาวิทยาลัย
          </span>
        </span>
      </button>

      {mode === "internal" && (
        <form action={formAction} className="reveal glass flex flex-col gap-4 rounded-2xl p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">รหัสนักศึกษา / รหัสบุคลากร</Label>
            <Input
              id="code"
              name="code"
              required
              autoComplete="username"
              inputMode="numeric"
              maxLength={20}
              placeholder="เช่น 6640011035"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">ชื่อ-นามสกุล</Label>
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              maxLength={100}
              placeholder="ชื่อที่จะบันทึกเป็นผู้แจ้ง"
            />
          </div>
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="h-12 press">
            {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            เข้าสู่ระบบและไปหน้าแจ้งซ่อม
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            ใช้ระบุตัวผู้แจ้งเพื่อเก็บประวัติการแจ้งซ่อม ระบบยังไม่ได้เชื่อมต่อกับ PSU Passport
            จึงไม่ต้องใส่รหัสผ่าน
          </p>
        </form>
      )}

      <form action={continueAsGuest}>
        <button
          type="submit"
          className="press glass flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <UserRound className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">บุคคลภายนอก / บุคคลทั่วไป</span>
            <span className="block text-sm text-muted-foreground">
              ไม่มีบัญชีของมหาวิทยาลัย เข้าแจ้งซ่อมได้ทันที
            </span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </button>
      </form>
    </div>
  );
}
