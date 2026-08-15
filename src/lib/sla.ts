import type { ReportStatus, Urgency } from "@/lib/supabase/types";

// SLA ตามระดับความเร่งด่วน (ITIL 4 ที่โครงงานอ้างอิง) — งานวิกฤตต้องปิดใน 4 ชม.
// งานไม่เร่งด่วนให้เวลา 7 วัน; ใบที่ AI ยังไม่ประเมินให้ใช้เกณฑ์ medium
export const SLA_HOURS: Record<Urgency, number> = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168,
};

export const SLA_LABEL: Record<Urgency, string> = {
  critical: "4 ชม.",
  high: "24 ชม.",
  medium: "3 วัน",
  low: "7 วัน",
};

const HOUR_MS = 60 * 60 * 1000;

export function slaDeadline(createdAt: string, urgency: Urgency | null): Date {
  const hours = SLA_HOURS[urgency ?? "medium"];
  return new Date(new Date(createdAt).getTime() + hours * HOUR_MS);
}

export type SlaState = "ok" | "warning" | "breached" | "met" | "missed";

export interface SlaInfo {
  state: SlaState;
  deadline: Date;
  // เวลาที่เหลือ (ลบ = เกินแล้ว) สำหรับงานเปิด; สำหรับงานปิดคือส่วนต่างตอนปิด
  remainingMs: number;
  label: string;
}

// สถานะ SLA ของใบหนึ่ง ณ เวลา now — งานปิดวัดจาก resolved_at, งานเปิดวัดจาก now
export function slaInfo(
  report: {
    created_at: string;
    urgency: Urgency | null;
    status: ReportStatus;
    resolved_at: string | null;
  },
  now: number
): SlaInfo {
  const deadline = slaDeadline(report.created_at, report.urgency);
  const closed = report.status === "done" || report.status === "cannot_proceed";

  if (closed) {
    const finishedAt = report.resolved_at ? new Date(report.resolved_at).getTime() : now;
    const remainingMs = deadline.getTime() - finishedAt;
    const met = remainingMs >= 0;
    return {
      state: met ? "met" : "missed",
      deadline,
      remainingMs,
      label: met ? "ทันกำหนด" : `เกินกำหนด ${formatDuration(-remainingMs)}`,
    };
  }

  const remainingMs = deadline.getTime() - now;
  if (remainingMs < 0) {
    return {
      state: "breached",
      deadline,
      remainingMs,
      label: `เกิน SLA ${formatDuration(-remainingMs)}`,
    };
  }
  // เตือนล่วงหน้าเมื่อเหลือไม่ถึง 25% ของเวลาทั้งหมด
  const total = SLA_HOURS[report.urgency ?? "medium"] * HOUR_MS;
  const warning = remainingMs < total * 0.25;
  return {
    state: warning ? "warning" : "ok",
    deadline,
    remainingMs,
    label: `เหลือ ${formatDuration(remainingMs)}`,
  };
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} นาที`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} ชม.`;
  return `${Math.floor(hours / 24)} วัน`;
}

// สรุปอัตราทำทัน SLA จากใบที่ปิดแล้ว
export function slaCompliance(
  reports: Array<{
    created_at: string;
    urgency: Urgency | null;
    status: ReportStatus;
    resolved_at: string | null;
  }>,
  now: number
): { closed: number; met: number; rate: number | null; breachedOpen: number } {
  let closed = 0;
  let met = 0;
  let breachedOpen = 0;
  for (const r of reports) {
    const info = slaInfo(r, now);
    if (info.state === "met" || info.state === "missed") {
      closed += 1;
      if (info.state === "met") met += 1;
    } else if (info.state === "breached") {
      breachedOpen += 1;
    }
  }
  return {
    closed,
    met,
    rate: closed === 0 ? null : Math.round((met / closed) * 1000) / 10,
    breachedOpen,
  };
}
