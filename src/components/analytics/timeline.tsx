import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export interface TimelineEvent {
  id: number;
  reportId: string;
  status: "pending" | "in_progress" | "done";
  changedAt: string;
  buildingName: string;
  roomName: string;
}

const STATUS_LABEL: Record<TimelineEvent["status"], string> = {
  pending: "แจ้งใหม่",
  in_progress: "เริ่มซ่อม",
  done: "ซ่อมเสร็จ",
};

const STATUS_COLOR: Record<TimelineEvent["status"], string> = {
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีความเคลื่อนไหว</p>;
  }

  return (
    <ol className="flex flex-col gap-4 border-l pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-[21px] top-1 size-2.5 rounded-full ${STATUS_COLOR[event.status]}`}
          />
          <div className="flex items-center gap-2">
            <Badge variant="outline">{STATUS_LABEL[event.status]}</Badge>
            <span className="text-sm font-medium">
              {event.buildingName} · {event.roomName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.changedAt), "d MMM yyyy HH:mm", { locale: th })}
          </p>
        </li>
      ))}
    </ol>
  );
}
