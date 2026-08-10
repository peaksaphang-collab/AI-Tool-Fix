"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CheckCircle2, Clock, Loader2, Search, Wrench, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupReport, type TrackResult } from "@/app/track/actions";

const STEPS = [
  { key: "pending", label: "รับเรื่องแล้ว", icon: Clock },
  { key: "in_progress", label: "กำลังซ่อม", icon: Wrench },
  { key: "done", label: "ซ่อมเสร็จ", icon: CheckCircle2 },
] as const;

function stepIndex(status: TrackResult["status"]) {
  if (status === "pending") return 0;
  if (status === "in_progress") return 1;
  return 2;
}

export function TrackForm() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await lookupReport(code);
      if (res.ok) {
        setResult(res.report);
        setError(null);
      } else {
        setResult(null);
        setError(res.message);
      }
    });
  }

  const cancelled = result?.status === "cannot_proceed";
  const active = result ? stepIndex(result.status) : 0;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="เช่น RP8F3K"
          maxLength={8}
          autoComplete="off"
          aria-label="รหัสติดตาม"
          className="h-12 text-center text-lg font-semibold tracking-[0.3em]"
        />
        <Button type="submit" size="lg" className="h-12 press" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          ค้นหา
        </Button>
      </form>

      {pending && !result && (
        <div className="glass space-y-3 rounded-2xl p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-16 animate-pulse rounded bg-muted" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="reveal glass flex flex-col gap-4 rounded-2xl p-5">
          <div>
            <p className="text-xs text-muted-foreground">รหัส {result.tracking_code}</p>
            <p className="text-lg font-semibold">
              {result.building_name} · {result.room_name}
            </p>
            {result.equipment && (
              <p className="text-sm text-muted-foreground">{result.equipment}</p>
            )}
            {result.service_type_name && (
              <p className="text-xs text-muted-foreground">{result.service_type_name}</p>
            )}
          </div>

          {cancelled ? (
            <p className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
              <XCircle className="size-4 shrink-0 text-muted-foreground" />
              เรื่องนี้ปิดโดยยังไม่ได้ซ่อม — ติดต่อฝ่ายซ่อมบำรุงเพื่อสอบถามเพิ่มเติม
            </p>
          ) : (
            <ol className="flex items-start gap-1">
              {STEPS.map((step, i) => {
                const reached = i <= active;
                const Icon = step.icon;
                return (
                  <li key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : reached ? "bg-primary" : "bg-border"}`} />
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          reached
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : i < active ? "bg-primary" : "bg-border"}`} />
                    </div>
                    <span className={`text-center text-xs ${reached ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-3 text-xs">
            <dt className="text-muted-foreground">แจ้งเมื่อ</dt>
            <dd className="text-right">
              {format(new Date(result.created_at), "d MMM yy HH:mm", { locale: th })}
            </dd>
            {result.resolved_at && (
              <>
                <dt className="text-muted-foreground">ซ่อมเสร็จเมื่อ</dt>
                <dd className="text-right">
                  {format(new Date(result.resolved_at), "d MMM yy HH:mm", { locale: th })}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
