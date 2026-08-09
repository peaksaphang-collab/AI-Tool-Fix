// Legacy-style reports ("รายงานการขอใช้ตามประเภทการให้บริการ" and
// "รายงานผลแต่ละคน") rendered as compact count strips — no pie/bar charts
// per the client's instruction.
export interface BreakdownRow {
  label: string;
  total: number;
  done: number;
}

export function BreakdownList({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.total));

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">{title}</h3>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
      )}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-sm">
            <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">
              {row.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-sky-500/70"
                style={{ width: `${(row.total / max) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {row.done}/{row.total}
            </span>
          </div>
        ))}
      </div>
      <p className="text-right text-[11px] text-muted-foreground">เสร็จแล้ว/ทั้งหมด</p>
    </div>
  );
}
