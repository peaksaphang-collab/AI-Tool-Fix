import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Shared public-page header: logo always returns home, optional back link.
export function SiteHeader({ backHref }: { backHref?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="ย้อนกลับ"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wrench className="size-5 text-emerald-600" />
          ระบบแจ้งซ่อม
        </Link>
      </div>
    </header>
  );
}
