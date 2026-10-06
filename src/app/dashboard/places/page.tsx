import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlacesManager } from "@/components/places/places-manager";
import { SetupRequired, isSupabaseConfigured } from "@/app/setup-required";

export default async function PlacesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: buildings }, { data: technicians }] = await Promise.all([
    supabase.from("buildings").select("*").eq("active", true).order("name"),
    supabase.from("technicians").select("id, name").order("sort_order").order("name"),
  ]);

  return (
    <main className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">จัดการหน่วยงานและผู้รับผิดชอบ</h1>
        <p className="text-sm text-muted-foreground">
          เพิ่มหรือลบได้เอง รายการนี้คือตัวเลือกในหน้าแจ้งซ่อม
        </p>
      </div>
      <PlacesManager buildings={buildings ?? []} technicians={technicians ?? []} />
    </main>
  );
}
