"use client";

import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rateReport } from "@/app/track/actions";

const LABELS = ["", "ไม่พอใจมาก", "ไม่พอใจ", "พอใช้", "พอใจ", "พอใจมาก"];

// วัด KPI "ความพึงพอใจ ≥ 4.0/5.0" ของงานวิจัย — ถามตอนผู้แจ้งเปิดดูผลงานที่ปิดแล้ว
export function RatingForm({ trackingCode }: { trackingCode: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-center text-sm">
        {done}
      </p>
    );
  }

  const shown = hover || rating;

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <p className="text-sm font-medium">ให้คะแนนการบริการครั้งนี้</p>

      <div className="flex items-center gap-2">
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ดาว`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => setRating(n)}
              className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Star
                className={`size-7 transition-colors ${
                  n <= shown
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
        {shown > 0 && (
          <span className="text-sm text-muted-foreground">{LABELS[shown]}</span>
        )}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="อยากบอกอะไรเพิ่มเติมไหมครับ (ไม่บังคับ)"
        rows={2}
        aria-label="ความเห็นเพิ่มเติม"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        disabled={rating === 0 || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await rateReport(trackingCode, rating, comment);
            if (res.ok) {
              setDone(res.message);
            } else {
              setError(res.message);
            }
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />}
        ส่งคะแนน
      </Button>
    </div>
  );
}
