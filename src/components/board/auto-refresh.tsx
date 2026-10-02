"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// ผู้แจ้งไม่มีสิทธิ์รับ Realtime ของตาราง reports (RLS เปิดให้เฉพาะเจ้าหน้าที่)
// จึงดึงตารางใหม่จากเซิร์ฟเวอร์เป็นรอบแทน
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    const stamp = () =>
      setUpdatedAt(
        new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    stamp();
    const timer = setInterval(() => {
      router.refresh();
      stamp();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <RefreshCw className="size-3.5" />
      อัปเดตอัตโนมัติทุก {seconds} วินาที{updatedAt && ` · ล่าสุด ${updatedAt}`}
    </p>
  );
}
