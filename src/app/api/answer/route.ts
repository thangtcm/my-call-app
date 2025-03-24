import { NextRequest, NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";

async function sendToDiscord(message: string, data: any = {}) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${message}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      }),
    });
  } catch (error) {}
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const uuid = searchParams.get("uuid");

  if (!from || !to || !uuid) {
    return NextResponse.json({ error: "Thiếu thông tin cuộc gọi" }, { status: 400 });
  }

  await sendToDiscord("Cuộc gọi mới:", { from, to, uuid });

  const scco = [
    {
      action: "talk",
      text: `Xin chào ${from}, tôi là trợ lý AI. Bạn cần hỗ trợ gì hôm nay?`,
      voice: "hn_female_thutrang_phrase_48k-hsmm",
      bargeIn: true,
    },
    {
      action: "record",
      eventUrl: ["https://my-call-app.vercel.app/api/converse"],
      format: "mp3",
      enable: true,
      mode: "voice",
      stopAfterSilence: 2,
    },
  ];

  return NextResponse.json(scco);
}
