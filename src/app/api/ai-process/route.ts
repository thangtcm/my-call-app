// api/ai-process.ts
import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0";
const API_DOMAIN = "https://my-call-app.vercel.app"; // Thay bằng domain thực tế của bạn
const assemblyAIClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
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

// Lấy JWT từ /api/auth
async function getStringeeJWT(userId: string): Promise<string> {
  try {
    const response = await fetch(`${API_DOMAIN}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy JWT: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    throw new Error(`Không thể lấy JWT từ /api/auth: ${String(error)}`);
  }
}

// Tải file ghi âm từ Stringee
async function fetchStringeeAudio(audioUrl: string, jwt: string): Promise<Buffer> {
  try {
    const response = await fetch(audioUrl, {
      method: "GET",
      headers: {
        "X-STRINGEE-AUTH": jwt,
      },
    });

    if (!response.ok) {
      throw new Error(`Không thể tải file từ Stringee: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Lỗi khi tải file từ Stringee: ${String(error)}`);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const audioUrl = body.audioUrl || body.recording_url;

  if (!audioUrl) {
    return NextResponse.json({ error: "Không nhận được file ghi âm" }, { status: 400 });
  }

  await sendToDiscord("🔊 Body response ai-process nhận được", { body });
  await sendToDiscord("🔊 File ghi âm nhận được", { audioUrl });

  try {
    const userId = body.fromNumber; 
    const jwt = await getStringeeJWT(userId);
    await sendToDiscord("🔑 Đã lấy JWT từ /api/auth", { userId });

    // Tải file từ Stringee
    const audioBuffer = await fetchStringeeAudio(audioUrl, jwt);
    await sendToDiscord("📥 Đã tải file âm thanh từ Stringee");

    const audioPublicUrl = await assemblyAIClient.files.upload(audioBuffer);
    await sendToDiscord("📄 Audio trích xuất", { audioPublicUrl });

    // Chuyển đổi âm thanh thành văn bản
    const transcript = await assemblyAIClient.transcripts.transcribe({
      audio: audioPublicUrl,
    });

    if (transcript.status !== "completed") {
      throw new Error(`Transcript chưa hoàn thành: ${transcript.status}`);
    }

    const text = transcript.text || "Không nhận diện được nội dung";
    await sendToDiscord("📄 Văn bản trích xuất", { text });

    // Echo lại nội dung bằng action "talk"
    const aiResponse = `Bạn vừa nói: ${text}`;

    const responseActions = [
      {
        action: "talk",
        text: aiResponse,
        voice: "hn_female_thutrang_phrase_48k-hsmm",
      },
      {
        action: "talk",
        text: "Cảm ơn bạn đã liên hệ. Xin chào và hẹn gặp lại!",
        voice: "hn_female_thutrang_phrase_48k-hsmm",
      },
    ];

    return NextResponse.json(responseActions);
  } catch (error) {
    console.error("Lỗi xử lý AI:", error);
    await sendToDiscord("❌ Lỗi xử lý", { error: String(error) });
    return NextResponse.json({ error: "Lỗi xử lý âm thanh" }, { status: 500 });
  }
}