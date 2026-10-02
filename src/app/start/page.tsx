import { SiteHeader } from "@/components/site-header";
import { StartChoice } from "@/components/start/start-choice";

export const metadata = {
  title: "เข้าสู่ระบบแจ้งซ่อม | ระบบแจ้งซ่อม",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">เข้าสู่ระบบแจ้งซ่อม</h1>
          <p className="text-sm text-muted-foreground">เลือกประเภทผู้ใช้งานก่อนแจ้งซ่อม</p>
        </div>
        <StartChoice initial={type === "internal" ? "internal" : null} />
      </main>
    </>
  );
}
