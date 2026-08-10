import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
          <Image
            src="/icon.png"
            alt="ระบบแจ้งซ่อม"
            width={32}
            height={32}
            className="size-8 rounded-md"
            priority
          />
          ระบบแจ้งซ่อม
        </Link>
      </div>
    </header>
  );
}
