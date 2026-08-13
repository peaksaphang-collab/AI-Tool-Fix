"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { openCountForRoom } from "@/app/report/actions";

// แจ้งผู้ใช้ว่าห้องนี้มีคนแจ้งค้างอยู่แล้ว — ลดใบซ้ำ ลดภาระเจ้าหน้าที่
export function DuplicateNotice({ roomId }: { roomId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const pending = roomId ? openCountForRoom(roomId) : Promise.resolve(0);
    pending.then((n) => {
      if (!cancelled) setCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (count < 1) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>
        ห้องนี้มีเรื่องแจ้งค้างอยู่แล้ว <strong>{count} รายการ</strong> —
        ถ้าเป็นเรื่องเดียวกันไม่ต้องแจ้งซ้ำ เจ้าหน้าที่กำลังดำเนินการอยู่
      </span>
    </p>
  );
}
