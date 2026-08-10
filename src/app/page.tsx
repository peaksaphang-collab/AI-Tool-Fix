import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Camera, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-50 to-white px-4 text-center">
      <Image
        src="/logo.png"
        alt="ระบบแจ้งซ่อม — Repair Notify System"
        width={667}
        height={593}
        priority
        className="h-auto w-64 max-w-full drop-shadow-sm sm:w-80"
      />
      <div>
        <h1 className="sr-only">ระบบแจ้งซ่อม</h1>
        <p className="text-muted-foreground">ถ่ายรูป แจ้งซ่อม ให้ AI ช่วยวิเคราะห์</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/report" className={buttonVariants({ size: "lg" })}>
          <Camera /> แจ้งซ่อม
        </Link>
        <Link
          href="/dashboard"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          <LayoutDashboard /> เข้าสู่ระบบเจ้าหน้าที่
        </Link>
      </div>
    </main>
  );
}
