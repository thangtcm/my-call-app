import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

const assemblyAIClient = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY as string,
});

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

async function textToSpeech(text: string, voice: string): Promise<string> {
  const response = await fetch("https://api.assemblyai.com/v2/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ASSEMBLYAI_API_KEY as string,
    },
    body: JSON.stringify({
      text,
      voice_id: voice, // Sử dụng voice_id theo tài liệu AssemblyAI
    }),
  });

  if (!response.ok) {
    throw new Error("Lỗi khi tạo giọng nói từ văn bản");
  }

  const data = await response.json();
  return data.audio_url;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const audioUrl = body.recording_url;

  if (!audioUrl) {
    return NextResponse.json({ error: "Không nhận được file ghi âm" }, { status: 400 });
  }

  await sendToDiscord("🔊 File ghi âm nhận được", { audioUrl });

  try {
    // Kiểm tra API key
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error("Thiếu AssemblyAI API Key");
    }

    // Chuyển đổi âm thanh thành văn bản
    const transcript = await assemblyAIClient.transcripts.transcribe({ audio: audioUrl });
    if (transcript.status !== "completed") {
      throw new Error("Lỗi trích xuất văn bản");
    }
    const text = transcript.text || "Không nhận diện được nội dung";
    await sendToDiscord("📄 Văn bản trích xuất", { text });

    // Tạo phản hồi AI (tạm thời echo)
    const aiResponse = `Bạn vừa nói: ${text}`;

    // Chuyển văn bản thành giọng nói
    const audioResponseUrl = await textToSpeech(
      aiResponse,
      "hn_female_thutrang_phrase_48k-hsmm"
    );
    await sendToDiscord("🔊 Phản hồi AI bằng giọng nói", { audioResponseUrl });

    // Trả về phản hồi cho cuộc gọi
    const responseActions = [
      { action: "stream", streamUrl: [audioResponseUrl] },
      {
        action: "talk",
        text: "Cảm ơn bạn đã liên hệ. Xin chào và hẹn gặp lại!",
        voice: "hn_female_thutrang_phrase_48k-hsmm",
      },
    ];

    return NextResponse.json(responseActions);
  } catch (error) {
    console.error("Lỗi xử lý AI:", error);
    await sendToDiscord("❌ Lỗi xử lý", { error: (error as Error).message });
    return NextResponse.json({ error: "Lỗi xử lý âm thanh" }, { status: 500 });
  }
}