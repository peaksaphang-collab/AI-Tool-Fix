import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getReporter } from "@/lib/reporter";
import { signOutReporter } from "@/app/start/actions";
import { ReportForm } from "@/components/report/report-form";
import { SiteHeader } from "@/components/site-header";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function ReportPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const reporter = await getReporter();
  if (!reporter) redirect("/start");

  const supabase = await createClient();

  const [{ data: buildings }, { data: serviceTypes }, { data: staff }] =
    await Promise.all([
      supabase.from("buildings").select("*").order("name"),
      supabase.from("service_types").select("*").order("id"),
      supabase.rpc("public_staff_names"),
    ]);

  // "อื่น ๆ" ไว้ท้ายรายการเสมอ
  const sortedBuildings = [...(buildings ?? [])].sort(
    (a, b) => Number(a.name.startsWith("อื่น")) - Number(b.name.startsWith("อื่น"))
  );

  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-2xl font-semibold">แจ้งซ่อม</h1>
          <p className="text-sm text-muted-foreground">
            ถ่ายรูปสิ่งที่เสีย เลือกอาคาร พิมพ์ห้องหรือจุดที่เสีย ระบบจะวิเคราะห์ให้อัตโนมัติ
          </p>
        </div>
        <div className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {reporter.type === "internal" ? "บุคลากรภายใน" : "บุคคลภายนอก / บุคคลทั่วไป"}
            </p>
            <p className="truncate font-medium">
              {reporter.type === "internal"
                ? `${reporter.name} (${reporter.code})`
                : "แจ้งซ่อมโดยไม่ระบุบัญชี"}
            </p>
          </div>
          <form action={signOutReporter}>
            <button
              type="submit"
              className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" /> เปลี่ยนผู้ใช้
            </button>
          </form>
        </div>
        <ReportForm
          reporterType={reporter.type}
          buildings={sortedBuildings}
          serviceTypes={serviceTypes ?? []}
          staff={staff ?? []}
        />
      </main>
    </>
  );
}
