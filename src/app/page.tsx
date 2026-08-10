import Image from "next/image";
import Link from "next/link";
import { Camera, Search, ArrowRight, Sparkles, BellRing, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/setup-required";

const STEPS = [
  {
    icon: Camera,
    title: "ถ่ายรูปสิ่งที่เสีย",
    body: "เปิดกล้องถ่ายตรงจุดที่มีปัญหา ไม่ต้องอธิบายยาว",
  },
  {
    icon: Sparkles,
    title: "AI วิเคราะห์ให้อัตโนมัติ",
    body: "ระบบบอกเองว่าอุปกรณ์อะไรเสีย ประเภทงานไหน และด่วนแค่ไหน",
  },
  {
    icon: BellRing,
    title: "เจ้าหน้าที่รับเรื่องทันที",
    body: "งานเด้งขึ้นหน้าจอเจ้าหน้าที่แบบเรียลไทม์ ติดตามสถานะได้ตลอด",
  },
];

// สถิติรวมแบบไม่ระบุตัวตน — สร้างความเชื่อมั่นโดยไม่เปิดข้อมูลใคร
async function getStats() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_repair_stats");
    if (error) return null;
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export const revalidate = 300;

export default async function Home() {
  const stats = await getStats();
  const hasStats = Boolean(stats && (stats.done_30d > 0 || stats.open_now > 0));

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,var(--color-accent)_0%,transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-sky-100/70 to-transparent dark:from-sky-950/40"
      />

      <section className="reveal flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <div className="glass rounded-3xl p-3 shadow-lg shadow-primary/10">
          <Image
            src="/logo.png"
            alt=""
            width={667}
            height={593}
            priority
            className="h-auto w-52 rounded-2xl sm:w-60"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold sm:text-4xl">ระบบแจ้งซ่อม</h1>
          <p className="text-balance text-muted-foreground">
            ถ่ายรูปสิ่งที่เสีย ส่งได้ใน 30 วินาที — ไม่ต้องกรอกฟอร์มยาว
            ไม่ต้องเดินไปแจ้งเอง
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/report"
            className={buttonVariants({
              size: "lg",
              className: "h-14 w-full text-base shadow-lg shadow-primary/20 press",
            })}
          >
            <Camera className="size-5" /> แจ้งซ่อม
          </Link>
          <Link
            href="/track"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "h-12 w-full press",
            })}
          >
            <Search className="size-4" /> ติดตามสถานะที่แจ้งไว้
          </Link>
        </div>

        {hasStats && stats && (
          <dl className="reveal glass grid w-full grid-cols-3 divide-x rounded-2xl px-2 py-3 text-center">
            <div className="px-1">
              <dd className="text-xl font-bold tabular-nums text-primary">
                {stats.done_30d}
              </dd>
              <dt className="text-[11px] leading-tight text-muted-foreground">
                ซ่อมเสร็จ
                <br />
                ใน 30 วัน
              </dt>
            </div>
            <div className="px-1">
              <dd className="text-xl font-bold tabular-nums text-primary">
                {stats.avg_hours != null ? `${Math.round(stats.avg_hours)}` : "—"}
              </dd>
              <dt className="text-[11px] leading-tight text-muted-foreground">
                ชั่วโมงเฉลี่ย
                <br />
                ต่องาน
              </dt>
            </div>
            <div className="px-1">
              <dd className="text-xl font-bold tabular-nums text-primary">
                {stats.open_now}
              </dd>
              <dt className="text-[11px] leading-tight text-muted-foreground">
                กำลัง
                <br />
                ดำเนินการ
              </dt>
            </div>
          </dl>
        )}
      </section>

      <section className="mt-14 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="reveal glass flex flex-col gap-2 rounded-2xl p-5 text-left"
            style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <step.icon className="size-5" />
            </span>
            <p className="flex items-center gap-1.5 font-semibold">
              <span className="text-xs tabular-nums text-primary">{i + 1}</span>
              {step.title}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <Link
        href="/dashboard"
        className="reveal mt-12 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        <Wrench className="size-3.5" />
        สำหรับเจ้าหน้าที่ซ่อมบำรุง
        <ArrowRight className="size-3.5" />
      </Link>
    </main>
  );
}
