import Link from "next/link";
import { Camera, Home, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-sm text-muted-foreground">
          ลิงก์อาจพิมพ์ผิดหรือหน้านี้ถูกย้ายแล้ว — ไปต่อได้จากปุ่มด้านล่าง
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonVariants({})}>
            <Home /> หน้าแรก
          </Link>
          <Link href="/report" className={buttonVariants({ variant: "outline" })}>
            <Camera /> แจ้งซ่อม
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            <LayoutDashboard /> แดชบอร์ดเจ้าหน้าที่
          </Link>
        </div>
      </main>
    </>
  );
}
