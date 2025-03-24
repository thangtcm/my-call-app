import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const assemblyAIClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

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

const callState = new Map<string, number>(); // Lưu trạng thái cuộc gọi

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const callId = body.call_id;
  const recordingUrl = body.recordingUrl;

  if (!callId) {
    return NextResponse.json([{ action: "talk", text: "Có lỗi xảy ra." }]);
  }

  const count = callState.get(callId) || 0;
  if (count >= 3) {  
    callState.delete(callId);
    return NextResponse.json([
      { action: "talk", text: "Xin cảm ơn, chúc bạn một ngày tốt lành!" },
    ]);
  }

  callState.set(callId, count + 1);

  let aiResponse = "Tôi chưa hiểu rõ. Bạn có thể nói lại không?";
  let customerText = "";

  if (recordingUrl) {
    await sendToDiscord("Đang xử lý ghi âm:", { recordingUrl });

    const transcript = await assemblyAIClient.transcripts.transcribe({
      audio: recordingUrl,
    });

    customerText = transcript.text || "";
    await sendToDiscord("Khách hàng nói:", { text: customerText });

    if (customerText.toLowerCase().includes("không") || customerText.toLowerCase().includes("không cần")) {
      return NextResponse.json([
        { action: "talk", text: "Cảm ơn bạn, chúc một ngày tốt lành!" },
      ]);
    }

    if (customerText.toLowerCase().includes("đơn hàng")) {
      aiResponse = "Đơn hàng của bạn đang được giao. Bạn có muốn biết thêm chi tiết không?";
    } else if (customerText.toLowerCase().includes("nhân viên")) {
      aiResponse = "Tôi sẽ chuyển bạn tới nhân viên. Vui lòng đợi trong giây lát.";
    }
  }

  await sendToDiscord("AI trả lời:", { response: aiResponse });

  return NextResponse.json([
    {
      action: "talk",
      text: aiResponse,
      voice: "hn_female_thutrang_phrase_48k-hsmm",
      bargeIn: true,
    },
    {
      action: "record",
      eventUrl: ["https://my-call-app.vercel.app/api/converse"],
      format: "mp3",
      mode: "voice",
      enable: true,
      stopAfterSilence: 2,
    },
  ]);
}
