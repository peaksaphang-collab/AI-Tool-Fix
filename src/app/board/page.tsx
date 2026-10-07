import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";
import { AutoRefresh } from "@/components/board/auto-refresh";
import type { PublicBoardRow, ReportStatus } from "@/lib/supabase/types";

export const metadata = {
  title: "ตารางแจ้งซ่อม | ระบบแจ้งซ่อม",
};

const STATUS: Record<ReportStatus, { label: string; className: string }> = {
  pending: { label: "รอดำเนินการ", className: "bg-amber-100 text-amber-800" },
  in_progress: { label: "กำลังซ่อม", className: "bg-sky-100 text-sky-800" },
  done: { label: "เสร็จแล้ว", className: "bg-emerald-100 text-emerald-800" },
  cannot_proceed: { label: "ดำเนินการไม่ได้", className: "bg-zinc-200 text-zinc-700" },
};

const REFRESH_SECONDS = 30;

// หน้านี้ render บนเซิร์ฟเวอร์ Vercel ซึ่งใช้เวลา UTC ต้องระบุเขตเวลาไทยเอง ไม่งั้นเวลาช้าไป 7 ชั่วโมง
const REPORTED_AT = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export default async function BoardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_report_board", { max_rows: 100 });
  const rows = (data ?? []) as PublicBoardRow[];

  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">ตารางแจ้งซ่อม</h1>
            <p className="text-sm text-muted-foreground">
              รายการแจ้งซ่อมล่าสุด 100 รายการ ดูย้อนหลังได้ว่าแจ้งอะไร ที่ไหน ใครรับผิดชอบ และถึงขั้นไหนแล้ว
            </p>
          </div>
          <AutoRefresh seconds={REFRESH_SECONDS} />
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            ระบบขัดข้องชั่วคราว กรุณาลองใหม่
          </p>
        ) : rows.length === 0 ? (
          <p className="glass rounded-2xl px-4 py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีรายการแจ้งซ่อม
          </p>
        ) : (
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-primary/5 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">ลำดับ</th>
                  <th className="px-3 py-2.5 font-medium">วันที่แจ้ง</th>
                  <th className="px-3 py-2.5 font-medium">หน่วยงาน</th>
                  <th className="px-3 py-2.5 font-medium">ห้อง / จุดที่เสีย</th>
                  <th className="px-3 py-2.5 font-medium">ประเภทงาน</th>
                  <th className="px-3 py-2.5 font-medium">อุปกรณ์</th>
                  <th className="px-3 py-2.5 font-medium">ผู้รับผิดชอบงาน</th>
                  <th className="px-3 py-2.5 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.created_at}-${i}`} className="border-b last:border-0 align-top">
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                      {REPORTED_AT.format(new Date(row.created_at))}
                    </td>
                    <td className="px-3 py-2.5">{row.building_name}</td>
                    <td className="px-3 py-2.5">{row.location ?? "-"}</td>
                    <td className="px-3 py-2.5">{row.service_type_name ?? "-"}</td>
                    <td className="px-3 py-2.5">{row.equipment ?? "-"}</td>
                    <td className="px-3 py-2.5">{row.assignee_name ?? "รอมอบหมาย"}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[row.status].className}`}
                      >
                        {STATUS[row.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
