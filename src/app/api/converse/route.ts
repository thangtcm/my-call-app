import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const assemblyAIClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const audioUrl = body.audioUrl; // Đoạn giọng nói của khách hàng từ Stringee
  const from = body.from;
  const callId = body.call_id;

  try {
    // 1. Speech-to-Text
    const transcript = await assemblyAIClient.transcripts.transcribe({ audio: audioUrl });
    const customerText = transcript.text || 'Tôi không nghe rõ';
    console.log('Customer said:', customerText);

    // 2. AI tư vấn (giả lập)
    let aiResponse = '';
    if (customerText.toLowerCase().includes('đơn hàng')) {
      aiResponse = 'Đơn hàng của bạn đang được giao. Bạn có muốn biết thêm chi tiết không?';
    } else if (customerText.toLowerCase().includes('hỗ trợ')) {
      aiResponse = 'Tôi có thể giúp bạn với các vấn đề kỹ thuật hoặc chuyển bạn tới nhân viên. Bạn muốn gì?';
    } else {
      aiResponse = 'Tôi chưa hiểu rõ. Bạn có thể nói lại không?';
    }
    console.log('AI response:', aiResponse);

    // 3. Dùng TTS của Stringee để test (vì không lưu ElevenLabs audio)
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
    console.error('Error:', error.message);
    const scco = [
      {
        action: 'talk',
        text: 'Có lỗi xảy ra. Vui lòng thử lại.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
      },
    ];
    return NextResponse.json(scco);
  }
}