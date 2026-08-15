"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportReportsCsv } from "@/app/dashboard/export-action";

export function ExportCsvButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await exportReportsCsv();
          if (!res.ok) {
            toast.error(res.message);
            return;
          }
          const blob = new Blob([res.content], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = res.filename;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`ดาวน์โหลด ${res.filename} แล้ว`);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Download />}
      ส่งออก CSV
    </Button>
  );
}
