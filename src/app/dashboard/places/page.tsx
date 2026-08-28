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

  const [{ data: buildings }, { data: rooms }] = await Promise.all([
    supabase.from("buildings").select("*").order("name"),
    supabase.from("rooms").select("*").order("name"),
  ]);

  return (
    <main className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">จัดการอาคารและห้อง</h1>
        <p className="text-sm text-muted-foreground">
          เพิ่ม แก้ หรือลบอาคารและห้องได้เอง — รายการนี้คือตัวเลือกในหน้าแจ้งซ่อม
        </p>
      </div>
      <PlacesManager buildings={buildings ?? []} rooms={rooms ?? []} />
    </main>
  );
}
