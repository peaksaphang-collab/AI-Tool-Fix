import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "@/components/report/report-form";
import { SiteHeader } from "@/components/site-header";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function ReportPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

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
        <ReportForm
          buildings={sortedBuildings}
          serviceTypes={serviceTypes ?? []}
          staff={staff ?? []}
        />
      </main>
    </>
  );
}
