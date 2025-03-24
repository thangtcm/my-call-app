import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const assemblyAIClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0';

// Hàm gửi log tới Discord
async function sendToDiscord(message: string, data: any = {}) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `${message}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      }),
    });
  } catch (error) {
    // Không làm gì nếu gửi Discord thất bại để không ảnh hưởng luồng chính
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  await sendToDiscord('Request body received:', body);

  const audioUrl = body.audioUrl;
  const from = body.from;
  const callId = body.call_id;

  if (!audioUrl || !from || !callId) {
    await sendToDiscord('Missing required fields:', { audioUrl, from, callId });
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Có lỗi xảy ra. Vui lòng thử lại.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
      },
    ]);
  }

  try {
    await sendToDiscord('Transcribing audio:', { audioUrl });
    const transcript = await assemblyAIClient.transcripts.transcribe({ audio: audioUrl });
    const customerText = transcript.text || 'Tôi không nghe rõ';
    await sendToDiscord('Customer said:', { text: customerText });

    let aiResponse = '';
    if (customerText.toLowerCase().includes('đơn hàng')) {
      aiResponse = 'Đơn hàng của bạn đang được giao. Bạn có muốn biết thêm chi tiết không?';
    } else {
      aiResponse = 'Tôi chưa hiểu rõ. Bạn có thể nói lại không?';
    }
    await sendToDiscord('AI response:', { response: aiResponse });

    const scco = [
      {
        action: 'talk',
        text: aiResponse,
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
      },
      {
        action: 'input',
        eventUrl: 'https://my-call-app.vercel.app/api/converse',
        mode: 'voice',
        timeout: 10,
      },
    ];

    return NextResponse.json(scco);
  } catch (error: any) {
    await sendToDiscord('Error details:', {
      message: error.message,
      stack: error.stack,
      audioUrl,
    });
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Có lỗi xảy ra. Vui lòng thử lại.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
      },
    ]);
  }
}