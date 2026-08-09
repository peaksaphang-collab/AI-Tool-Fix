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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set; skipping photo analysis.");
    return null;
  }

  try {
    const message = await client.messages.create({
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
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
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
