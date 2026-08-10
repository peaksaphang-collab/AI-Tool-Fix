import { SiteHeader } from "@/components/site-header";
import { TrackForm } from "@/components/track/track-form";

export const metadata = {
  title: "ติดตามสถานะแจ้งซ่อม | ระบบแจ้งซ่อม",
};

export default function TrackPage() {
  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">ติดตามสถานะ</h1>
          <p className="text-sm text-muted-foreground">
            ใส่รหัสติดตาม 6 ตัวที่ได้ตอนแจ้งซ่อม เพื่อดูว่าเรื่องถึงขั้นไหนแล้ว
          </p>
        </div>
        <TrackForm />
      </main>
    </>
  );
}
