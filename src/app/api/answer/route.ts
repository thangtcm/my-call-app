import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const API_DOMAIN = "https://my-call-app.vercel.app";

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

export async function GET(request: NextRequest) {
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
      text: "Xin chào, tôi là trợ lý AI. Hãy đặt câu hỏi sau tiếng bíp.",
      voice: "hn_female_thutrang_phrase_48k-hsmm",
      bargeIn: true,
    },
    {
      action: "recordMessage",
      eventUrl: `${API_DOMAIN}/api/ai-process`,
      beepStart: true,
      timeout: 60000,
      format: "wav",
      silenceThresh: 12,
      silenceTimeout: 4000,
    },
  ];

  return NextResponse.json(scco);
}
