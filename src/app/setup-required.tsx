export function SetupRequired() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">ยังตั้งค่าระบบไม่เสร็จ</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        ต้องกำหนดค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY
        ในไฟล์ .env.local ก่อน (ดูตัวอย่างใน .env.local.example) แล้วรีสตาร์ทเซิร์ฟเวอร์
      </p>
    </main>
  );
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
