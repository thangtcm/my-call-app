import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const uuid = searchParams.get('uuid');

  if (!from || !to || !uuid) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const scco = [
    {
      action: 'talk',
      text: `Xin chào ${from}, tôi là trợ lý AI của tổng đài. Bạn cần hỗ trợ gì hôm nay?`,
      voice: 'hn_female_thutrang_phrase_48k-hsmm',
      bargeIn: true,
    },
    {
      action: 'record',
      eventUrl: 'https://my-call-app.vercel.app/api/converse',
      format: 'mp3',
      enable: true,
      stopAfterSilence: 2, // Dừng ghi âm sau 2 giây im lặng
    },
  ];

  return NextResponse.json(scco);
}