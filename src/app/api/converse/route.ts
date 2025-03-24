import { NextRequest, NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1353863038213816430/LR0owTe6yD7gx0j6fiVVUf9vOWhuvN3InNAyC93RGZyt78uVdbgOEsSuWgu10l91GOb0';

async function sendToDiscord(message: string, data: any = {}) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `${message}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      }),
    });
  } catch (error) {}
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  await sendToDiscord('Request body received:', body);

  const dtmf = body.dtmf; // Phím khách hàng nhấn
  const from = body.from || 'Unknown';
  const callId = body.call_id;
  const timeout = body.timeout;

  if (!callId) {
    await sendToDiscord('Missing callId:', body);
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Có lỗi xảy ra. Vui lòng thử lại.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
      },
    ]);
  }

  let scco = [];
  if (timeout) {
    await sendToDiscord('Timeout occurred:', { callId });
    scco = [
      {
        action: 'talk',
        text: 'Bạn chưa chọn gì. Nhấn 1 để kiểm tra đơn hàng, nhấn 2 để gặp nhân viên, sau đó nhấn phím thăng.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
      },
      {
        action: 'input',
        eventUrl: 'https://my-call-app.vercel.app/api/converse',
        mode: 'dtmf',
        submitOnHash: true,
        timeout: 15,
        maxLength: 2,
      },
    ];
  } else if (dtmf === '1') {
    await sendToDiscord('Customer chose 1:', { callId });
    scco = [
      {
        action: 'talk',
        text: 'Đơn hàng của bạn đang được giao. Cảm ơn bạn đã sử dụng dịch vụ!',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
      },
    ];
  } else if (dtmf === '2') {
    await sendToDiscord('Customer chose 2:', { callId });
    scco = [
      {
        action: 'connect',
        from: {
          type: 'external',
          number: from,
          alias: from,
        },
        to: {
          type: 'internal',
          number: 'agent_001', // Thay bằng userId agent thực tế
          alias: 'Agent 001',
        },
      },
    ];
  } else {
    await sendToDiscord('Invalid DTMF:', { dtmf, callId });
    scco = [
      {
        action: 'talk',
        text: 'Lựa chọn không hợp lệ. Nhấn 1 để kiểm tra đơn hàng, nhấn 2 để gặp nhân viên, sau đó nhấn phím thăng.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
      },
      {
        action: 'input',
        eventUrl: 'https://my-call-app.vercel.app/api/converse',
        mode: 'dtmf',
        submitOnHash: true,
        timeout: 15,
        maxLength: 2,
      },
    ];
  }

  return NextResponse.json(scco);
}