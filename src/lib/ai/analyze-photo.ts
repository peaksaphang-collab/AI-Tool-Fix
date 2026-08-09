import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export interface PhotoAnalysis {
  equipmentType: string;
  description: string;
  confidence: number;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    },
    required: ["equipmentType", "description", "confidence"],
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
              text: "นี่คือรูปที่ผู้ใช้ถ่ายเพื่อแจ้งซ่อม วิเคราะห์ว่าอุปกรณ์อะไรและเสียตรงไหน",
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

    return {
      equipmentType: input.equipmentType,
      description: input.description,
      confidence: Math.max(0, Math.min(1, input.confidence)),
    };
  } catch (error) {
    console.error("Photo analysis failed:", error);
    return null;
  }
}
