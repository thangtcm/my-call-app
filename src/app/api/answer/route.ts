import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/xxx/xxx";

async function sendToDiscord(message: string, data: any = {}) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${message}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      }),
    });
  } catch (error) {
    console.error("Failed to send Discord log:", error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const uuid = searchParams.get("uuid");

  if (!from || !to || !uuid) {
    return NextResponse.json({ error: "Thiếu thông tin cuộc gọi" }, { status: 400 });
  }

  await sendToDiscord("📞 Cuộc gọi đến tổng đài", { from, to, uuid });

  const scco = [
    {
      action: "talk",
      text: `Xin chào, tôi là trợ lý AI. Bạn cần hỗ trợ gì hôm nay?`,
      voice: "hn_female_thutrang_phrase_48k-hsmm",
      bargeIn: true,
    },
    {
      action: "input",
      eventUrl: "https://my-call-app.vercel.app/api/converse",
      type: ["speech"],
      speech: {
        endOnSilence: 1.5,
        language: "vi-VN",
      },
    },
  ];

  return NextResponse.json(scco);
}
