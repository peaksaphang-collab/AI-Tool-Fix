import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "@/components/report/report-form";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function ReportPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();

  const [{ data: buildings }, { data: rooms }] = await Promise.all([
    supabase.from("buildings").select("*").order("name"),
    supabase.from("rooms").select("*").order("name"),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">แจ้งซ่อม</h1>
        <p className="text-sm text-muted-foreground">
          ถ่ายรูปสิ่งที่เสีย เลือกอาคารและห้อง ระบบจะวิเคราะห์ให้อัตโนมัติ
        </p>
      </div>
      <ReportForm buildings={buildings ?? []} rooms={rooms ?? []} />
    </main>
  );
}
