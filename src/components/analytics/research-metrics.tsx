import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ResearchMetrics {
  ai_analyzed: number;
  ai_type_correct: number;
  ai_type_accuracy: number | null;
  ai_urgency_correct: number;
  ai_urgency_accuracy: number | null;
  avg_submit_seconds: number | null;
  rated_count: number;
  avg_satisfaction: number | null;
}

// ตัวชี้วัดที่ประกาศไว้กับอาจารย์ที่ปรึกษา — รวมไว้หน้าเดียวเพื่อใช้ตอบตอนสอบ
// เป้าหมายอ้างอิงจากสไลด์นำเสนอโครงงาน
const TARGETS = {
  aiAccuracy: 85, // %
  satisfaction: 4.0, // /5
  submitSeconds: 120, // ระบบเดิม 10-15 นาที เป้าลด 80% → ~2 นาที
};

function Tile({
  label,
  value,
  target,
  hit,
  note,
}: {
  label: string;
  value: string;
  target: string;
  hit: boolean | null;
  note: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p
          className={`text-2xl font-semibold ${
            hit === null ? "" : hit ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">
          เป้าหมาย {target}
          {hit === null ? " · ยังไม่มีข้อมูล" : hit ? " · ผ่าน" : " · ยังไม่ถึง"}
        </p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export function ResearchMetricsPanel({ metrics }: { metrics: ResearchMetrics | null }) {
  if (!metrics) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        ยังอ่านตัวชี้วัดงานวิจัยไม่ได้ — ตรวจว่ารัน{" "}
        <code className="rounded bg-muted px-1">0009_research_metrics.sql</code> แล้วหรือยัง
      </div>
    );
  }

  const typeAccuracy = metrics.ai_type_accuracy;
  const satisfaction = metrics.avg_satisfaction;
  const submitSeconds = metrics.avg_submit_seconds;

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">ตัวชี้วัดงานวิจัย</h3>
        <p className="text-xs text-muted-foreground">
          เทียบกับเป้าหมายที่เสนอไว้ในโครงงาน — ใช้ตอบอาจารย์ที่ปรึกษาได้ทันที
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="ความแม่นยำจัดหมวดของ AI"
          value={typeAccuracy === null ? "-" : `${typeAccuracy}%`}
          target={`≥ ${TARGETS.aiAccuracy}%`}
          hit={typeAccuracy === null ? null : typeAccuracy >= TARGETS.aiAccuracy}
          note={`ถูก ${metrics.ai_type_correct} จาก ${metrics.ai_analyzed} ใบที่ AI วิเคราะห์`}
        />
        <Tile
          label="ความแม่นยำประเมินความเร่งด่วน"
          value={
            metrics.ai_urgency_accuracy === null
              ? "-"
              : `${metrics.ai_urgency_accuracy}%`
          }
          target={`≥ ${TARGETS.aiAccuracy}%`}
          hit={
            metrics.ai_urgency_accuracy === null
              ? null
              : metrics.ai_urgency_accuracy >= TARGETS.aiAccuracy
          }
          note={`ถูก ${metrics.ai_urgency_correct} ใบ`}
        />
        <Tile
          label="เวลาเฉลี่ยที่ใช้แจ้ง"
          value={submitSeconds === null ? "-" : `${submitSeconds} วิ`}
          target={`≤ ${TARGETS.submitSeconds} วิ`}
          hit={submitSeconds === null ? null : submitSeconds <= TARGETS.submitSeconds}
          note="ระบบเดิมใช้ 10-15 นาที"
        />
        <Tile
          label="ความพึงพอใจเฉลี่ย"
          value={satisfaction === null ? "-" : `${satisfaction}/5`}
          target={`≥ ${TARGETS.satisfaction}/5`}
          hit={satisfaction === null ? null : satisfaction >= TARGETS.satisfaction}
          note={`จากผู้ให้คะแนน ${metrics.rated_count} คน`}
        />
      </div>
    </section>
  );
}
