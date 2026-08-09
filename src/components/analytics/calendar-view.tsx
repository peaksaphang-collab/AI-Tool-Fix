"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function CalendarView({ timestamps }: { timestamps: string[] }) {
  const [month, setMonth] = useState(() => new Date());

  const countByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ts of timestamps) {
      const key = format(new Date(ts), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [timestamps]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeft />
        </Button>
        <p className="font-medium">{format(month, "MMMM yyyy", { locale: th })}</p>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = countByDay.get(key) ?? 0;
          return (
            <div
              key={key}
              className={`flex aspect-square flex-col items-center justify-center rounded-md border text-xs ${
                isSameMonth(day, month) ? "" : "text-muted-foreground/40"
              } ${isToday(day) ? "border-primary" : ""}`}
            >
              <span>{format(day, "d")}</span>
              {count > 0 && (
                <span className="mt-0.5 rounded-full bg-emerald-500/15 px-1.5 text-emerald-600">
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
