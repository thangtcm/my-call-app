import { NextRequest, NextResponse } from "next/server";

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";

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

async function transcribeAudio(audioUrl: string) {
  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url: audioUrl }),
  });

  const { id } = await response.json();
  if (!id) throw new Error("Không thể tạo transcript");

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const transcriptRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { Authorization: ASSEMBLYAI_API_KEY! },
    });
    const transcriptData = await transcriptRes.json();
    if (transcriptData.status === "completed") {
      return transcriptData.text;
    }
  }
}

async function textToSpeech(text: string) {
  const response = await fetch("https://api.assemblyai.com/v2/speech", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      voice: "hn_female_thutrang_phrase_48k-hsmm",
    }),
  });

  const { audio_url } = await response.json();
  return audio_url;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const audioUrl = body.recording_url;

  if (!audioUrl) {
    return NextResponse.json({ error: "Không nhận được file ghi âm" }, { status: 400 });
  }

  await sendToDiscord("🔊 File ghi âm nhận được", { audioUrl });

  let text;
  try {
    text = await transcribeAudio(audioUrl);
    await sendToDiscord("📄 Văn bản trích xuất", { text });
  } catch (error) {
    console.error("Lỗi trích xuất văn bản:", error);
    return NextResponse.json({ error: "Lỗi xử lý âm thanh" }, { status: 500 });
  }

  // 💡 Xử lý AI - Tạm thời echo lại
  const aiResponse = `Bạn vừa nói: ${text}`;

  let audioResponseUrl;
  try {
    audioResponseUrl = await textToSpeech(aiResponse);
    await sendToDiscord("🔊 Phản hồi AI bằng giọng nói", { audioResponseUrl });
  } catch (error) {
    console.error("Lỗi tạo phản hồi âm thanh:", error);
    return NextResponse.json({ error: "Lỗi tạo phản hồi giọng nói" }, { status: 500 });
  }

  const responseActions = [
    {
      action: "stream",
      streamUrl: [audioResponseUrl],
    },
    {
      action: "talk",
      text: "Cảm ơn bạn đã liên hệ. Xin chào và hẹn gặp lại!",
      voice: "hn_female_thutrang_phrase_48k-hsmm",
    },
  ];

  return NextResponse.json(responseActions);
}
