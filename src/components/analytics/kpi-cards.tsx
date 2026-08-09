import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCards({
  total,
  pending,
  inProgress,
  done,
  avgResolutionHours,
}: {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  avgResolutionHours: number | null;
}) {
  const items = [
    { label: "รายการทั้งหมด", value: total },
    { label: "รอดำเนินการ", value: pending },
    { label: "กำลังซ่อม", value: inProgress },
    { label: "เสร็จแล้ว", value: done },
    {
      label: "เวลาซ่อมเฉลี่ย",
      value: avgResolutionHours === null ? "-" : `${avgResolutionHours.toFixed(1)} ชม.`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
