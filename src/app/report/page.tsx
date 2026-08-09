import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "@/components/report/report-form";
import { SiteHeader } from "@/components/site-header";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function ReportPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();

  const [{ data: buildings }, { data: rooms }, { data: serviceTypes }] =
    await Promise.all([
      supabase.from("buildings").select("*").order("name"),
      supabase.from("rooms").select("*").order("name"),
      supabase.from("service_types").select("*").order("id"),
    ]);

  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">แจ้งซ่อม</h1>
          <p className="text-sm text-muted-foreground">
            ถ่ายรูปสิ่งที่เสีย เลือกอาคารและห้อง ระบบจะวิเคราะห์ให้อัตโนมัติ
          </p>
        </div>
        <ReportForm
          buildings={buildings ?? []}
          rooms={rooms ?? []}
          serviceTypes={serviceTypes ?? []}
        />
      </main>
    </>
  );
}
