"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, isSameMonth, isSameYear, subDays, subMonths, subYears } from "date-fns";
import { th } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportWithLocation } from "@/components/dashboard/dashboard-client";

type Period = "day" | "month" | "year";

// Client requirement: daily / monthly / yearly case summary as a dashboard,
// displayed without pie or bar charts — so this uses stat tiles + a compact
// recent-period strip instead.
export function PeriodSummary({ reports }: { reports: ReportWithLocation[] }) {
  const [period, setPeriod] = useState<Period>("day");
  const [now] = useState(() => new Date());

  const { label, current, previous, buckets } = useMemo(() => {
    const same = { day: isSameDay, month: isSameMonth, year: isSameYear }[period];
    const sub = { day: subDays, month: subMonths, year: subYears }[period];
    const fmt = { day: "d MMM", month: "MMM yy", year: "yyyy" }[period];
    const bucketCount = { day: 7, month: 6, year: 3 }[period];

    const inPeriod = (anchor: Date) =>
      reports.filter((r) => same(new Date(r.created_at), anchor));

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const anchor = sub(now, bucketCount - 1 - i);
      const items = inPeriod(anchor);
      return {
        key: format(anchor, fmt, { locale: th }),
        total: items.length,
        done: items.filter((r) => r.status === "done").length,
      };
    });

    return {
      label: { day: "วันนี้", month: "เดือนนี้", year: "ปีนี้" }[period],
      current: inPeriod(now),
      previous: inPeriod(sub(now, 1)),
      buckets,
    };
  }, [reports, period, now]);

  const doneCount = current.filter((r) => r.status === "done").length;
  const diff = current.length - previous.length;
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">สรุปเคสตามช่วงเวลา</h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="day">รายวัน</TabsTrigger>
            <TabsTrigger value="month">รายเดือน</TabsTrigger>
            <TabsTrigger value="year">รายปี</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">แจ้งเข้า{label}</p>
          <p className="text-2xl font-semibold">{current.length}</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">เสร็จแล้ว{label}</p>
          <p className="text-2xl font-semibold text-emerald-600">{doneCount}</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">เทียบช่วงก่อนหน้า</p>
          <p
            className={`text-2xl font-semibold ${
              diff > 0 ? "text-amber-600" : diff < 0 ? "text-emerald-600" : ""
            }`}
          >
            {diff > 0 ? `+${diff}` : diff}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {buckets.map((bucket) => (
          <div key={bucket.key} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              {bucket.key}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500/70"
                style={{ width: `${(bucket.total / maxBucket) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {bucket.done}/{bucket.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
