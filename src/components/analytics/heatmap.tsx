const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const BUCKET_LABELS = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];

// ไทยไม่มีเวลาออมแสง บวก 7 ชั่วโมงจาก UTC แล้วอ่านค่าแบบ UTC จะได้ผลเท่ากันทั้งตอน render บนเซิร์ฟเวอร์และในเบราว์เซอร์
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function bucketFor(hour: number) {
  return Math.floor(hour / 4);
}

export function Heatmap({ timestamps }: { timestamps: string[] }) {
  const grid = Array.from({ length: 7 }, () => Array(6).fill(0));

  for (const ts of timestamps) {
    const date = new Date(new Date(ts).getTime() + BANGKOK_OFFSET_MS);
    grid[date.getUTCDay()][bucketFor(date.getUTCHours())] += 1;
  }

  const max = Math.max(1, ...grid.flat());

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10" />
            {BUCKET_LABELS.map((label) => (
              <th key={label} className="px-1 text-xs font-normal text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, dayIndex) => (
            <tr key={DAY_LABELS[dayIndex]}>
              <td className="pr-2 text-right text-xs text-muted-foreground">
                {DAY_LABELS[dayIndex]}
              </td>
              {row.map((count, bucketIndex) => (
                <td key={bucketIndex}>
                  <div
                    title={`${count} รายการ`}
                    className="size-9 rounded-sm bg-emerald-500"
                    style={{ opacity: count === 0 ? 0.08 : 0.25 + (count / max) * 0.75 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
