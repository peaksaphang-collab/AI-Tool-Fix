"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Always log — a silent error boundary hides real failures.
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาดชั่วคราว</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        ระบบขัดข้องชั่วขณะ ข้อมูลที่ส่งไว้แล้วไม่หายไป — ลองใหม่อีกครั้ง
        หรือกลับหน้าแรกได้เลย
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw /> ลองใหม่
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          <Home /> หน้าแรก
        </Link>
      </div>
    </main>
  );
}
