import Link from "next/link";
import { BarChart3, ClipboardList, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { logout } from "./logout-action";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ClipboardList /> รายการแจ้งซ่อม
          </Link>
          <Link
            href="/dashboard/analytics"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <BarChart3 /> สรุปข้อมูล
          </Link>
          <form action={logout} className="ml-auto">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> ออกจากระบบ
            </Button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
