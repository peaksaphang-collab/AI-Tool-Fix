import Image from "next/image";
import Link from "next/link";
import { BarChart3, Camera, ClipboardList, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { logout } from "./logout-action";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-sky-50/40">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-3 py-2 sm:gap-2 sm:px-4 sm:py-3">
          <Link href="/" className="mr-1 flex items-center gap-2 font-semibold sm:mr-2">
            <Image
              src="/icon.png"
              alt="ระบบแจ้งซ่อม"
              width={32}
              height={32}
              className="size-7 rounded-md sm:size-8"
              priority
            />
            <span className="hidden sm:inline">ระบบแจ้งซ่อม</span>
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ClipboardList />
            <span className="hidden xs:inline sm:inline">รายการแจ้งซ่อม</span>
          </Link>
          <Link
            href="/dashboard/analytics"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <BarChart3 /> สรุปข้อมูล
          </Link>
          <Link
            href="/report"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Camera /> แจ้งซ่อม
          </Link>
          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
