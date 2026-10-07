import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Urgency } from "@/lib/supabase/types";

export interface PhotoAnalysis {
  equipmentType: string;
  description: string;
  confidence: number;
  serviceTypeId: number | null;
  urgency: Urgency | null;
}

// Kie.ai ขายสิทธิ์เรียก Claude รุ่นเดียวกันผ่าน endpoint แบบเดียวกับ Anthropic
// มีคีย์ Kie ใช้ Kie ไม่มีก็เรียก Anthropic ตรง
// ตัดสิ่งที่มักติดมาตอนวางคีย์ในหน้าตั้งค่า: ช่องว่าง ขึ้นบรรทัด คำว่า Bearer และเครื่องหมายคำพูด
const PASTED_KEY = process.env.KIE_API_KEY?.trim()
  .replace(/^bearer\s+/i, "")
  .replace(/^["']+|["']+$/g, "")
  .trim();
// คีย์ที่ขึ้นต้น sk-ant- เป็นคีย์ของ Anthropic เอง แม้ใส่ไว้ในช่อง KIE_API_KEY ก็เรียก Anthropic ตรง
const KIE_KEY = PASTED_KEY?.startsWith("sk-ant-") ? undefined : PASTED_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? (KIE_KEY ? undefined : PASTED_KEY);
const KIE_URL = "https://api.kie.ai/claude/v1/messages";
const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

type Block = { type?: string; id?: string; name?: string; input?: unknown; text?: string };

// Kie ตอบด้วย HTTP 200 แม้เป็นข้อผิดพลาด และอาจห่อข้อความไว้ใน { code, msg, data }
// หรือส่งเป็น stream แม้ขอ stream: false จึงอ่านเองทุกแบบ แล้ว log เหตุผลเมื่อไม่มีคำตอบ
function contentOf(text: string): Block[] | null {
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json?.content)) return json.content;
    if (Array.isArray(json?.data?.content)) return json.data.content;
    return null;
  } catch {
    // ไม่ใช่ JSON ก้อนเดียว ลองอ่านแบบ server-sent events
  }
  const blocks: (Block & { partial?: string })[] = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("data:")) continue;
    let event;
    try {
      event = JSON.parse(line.slice(5).trim());
    } catch {
      continue;
    }
    if (event.type === "content_block_start") {
      blocks[event.index] = { ...event.content_block, partial: "" };
    } else if (event.type === "content_block_delta" && blocks[event.index]) {
      if (event.delta?.type === "input_json_delta") blocks[event.index].partial += event.delta.partial_json;
      if (event.delta?.type === "text_delta") {
        blocks[event.index].text = (blocks[event.index].text ?? "") + event.delta.text;
      }
    }
  }
  const content = blocks.filter(Boolean).map(({ partial, ...block }) =>
    block.type === "tool_use" && partial ? { ...block, input: JSON.parse(partial) } : block
  );
  return content.length ? content : null;
}

async function callKie(request: Anthropic.MessageCreateParamsNonStreaming): Promise<Block[] | null> {
  const res = await fetch(KIE_URL, {
    method: "POST",
    // Kie ยืนยันตัวด้วย Bearer อย่างเดียวตามเอกสาร
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIE_KEY}`,
    },
    body: JSON.stringify({ ...request, stream: false }),
  });
  const text = await res.text();
  const content = contentOf(text);
  if (!content) {
    console.error("Kie returned no message:", res.status, text.slice(0, 400));
    if (text.includes('"code":401')) await logKeyCheck();
  }
  return content;
}

// แยกให้ออกว่าคีย์ผิดทั้งบัญชี หรือคีย์ใช้ได้แต่เรียก Claude ไม่ได้ โดยไม่พิมพ์คีย์ลง log
async function logKeyCheck() {
  const key = KIE_KEY ?? "";
  const credit = await fetch("https://api.kie.ai/api/v1/chat/credit", {
    headers: { Authorization: `Bearer ${key}` },
  })
    .then((r) => r.text())
    .catch((error) => String(error));
  console.error("Kie key check:", {
    length: key.length,
    plain: /^[A-Za-z0-9_-]+$/.test(key),
    kind: /^[a-f0-9]{32}$/i.test(key) ? "kie" : (key.match(/^sk-[a-z]+/i)?.[0] ?? "unknown"),
    credit: credit.slice(0, 200),
  });
}

const URGENCY_VALUES: Urgency[] = ["critical", "high", "medium", "low"];

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "report_equipment_issue",
  description: "Report what equipment is shown and what looks broken about it.",
  input_schema: {
    type: "object",
    properties: {
      equipmentType: {
        type: "string",
        description:
          'The equipment shown, in Thai, e.g. "เครื่องปรับอากาศ", "หลอดไฟ", "ประตู", "ก๊อกน้ำ". Use "ไม่ทราบ" if unclear.',
      },
      description: {
        type: "string",
        description:
          "One or two sentences in Thai describing what looks damaged, broken, or wrong.",
      },
      confidence: {
        type: "number",
        description: "0 to 1 confidence that the classification is correct.",
      },
      serviceTypeId: {
        type: "integer",
        description:
          "Service category: 1=งานซ่อมแซมครุภัณฑ์สุขาภิบาล (ประปา ท่อ สุขภัณฑ์), 2=งานซ่อมแซมครุภัณฑ์ไฟฟ้า (ไฟฟ้า หลอดไฟ ปลั๊ก), 3=งานซ่อมแซมเครื่องปรับอากาศ, 4=งานซ่อมแซมอาคาร (ประตู หน้าต่าง ฝ้า ผนัง ป้าย), 5=งานซ่อมแซมครุภัณฑ์สำนักงาน (โต๊ะ เก้าอี้ อุปกรณ์สำนักงาน)",
        enum: [1, 2, 3, 4, 5],
      },
      urgency: {
        type: "string",
        description:
          "Urgency: critical = อันตราย/กระทบวงกว้าง (ไฟฟ้าลัดวงจร น้ำท่วม), high = ใช้งานไม่ได้เลย, medium = ใช้งานได้บางส่วน, low = ความเสียหายเล็กน้อย/ความสวยงาม",
        enum: URGENCY_VALUES,
      },
    },
    required: ["equipmentType", "description", "confidence", "serviceTypeId", "urgency"],
  },
};

// Best-effort: a failed analysis should never block someone from submitting
// a report, it just means staff fill in the details manually instead.
export async function analyzePhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<PhotoAnalysis | null> {
  if (!KIE_KEY && !ANTHROPIC_KEY) {
    console.error("Neither KIE_API_KEY nor ANTHROPIC_API_KEY is set; skipping photo analysis.");
    return null;
  }

  try {
    const request: Anthropic.MessageCreateParamsNonStreaming = {
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "report_equipment_issue" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: "นี่คือรูปที่ผู้ใช้ถ่ายเพื่อแจ้งซ่อม วิเคราะห์ว่าอุปกรณ์อะไร เสียตรงไหน จัดหมวดประเภทงานซ่อม และประเมินความเร่งด่วน",
            },
          ],
        },
      ],
    };

    const content: Block[] | null = KIE_KEY
      ? await callKie(request)
      : (await client.messages.create(request)).content;
    const toolUse = content?.find((block) => block.type === "tool_use");
    if (!toolUse) return null;

    const input = toolUse.input as Partial<PhotoAnalysis>;
    if (
      typeof input.equipmentType !== "string" ||
      typeof input.description !== "string" ||
      typeof input.confidence !== "number"
    ) {
      return null;
    }

    const serviceTypeId =
      typeof input.serviceTypeId === "number" &&
      input.serviceTypeId >= 1 &&
      input.serviceTypeId <= 5
        ? input.serviceTypeId
        : null;

    const urgency = URGENCY_VALUES.includes(input.urgency as Urgency)
      ? (input.urgency as Urgency)
      : null;

    return {
      equipmentType: input.equipmentType,
      description: input.description,
      confidence: Math.max(0, Math.min(1, input.confidence)),
      serviceTypeId,
      urgency,
    };
  } catch (error) {
    console.error("Photo analysis failed:", error);
    return null;
  }
}
