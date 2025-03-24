import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // Số khách hàng
  const to = searchParams.get('to');     // Số tổng đài
  const uuid = searchParams.get('uuid'); // ID cuộc gọi

  if (!from || !to || !uuid) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const scco = [
    {
      action: 'talk',
      text: `Xin chào ${from}, cảm ơn bạn đã gọi tới tổng đài. Nhấn 1 để kiểm tra đơn hàng, nhấn 2 để gặp nhân viên, sau đó nhấn phím thăng để xác nhận.`,
      voice: 'hn_female_thutrang_phrase_48k-hsmm',
      bargeIn: true,
      speed: 1.0,
    },
    {
      action: 'input',
      eventUrl: 'https://my-call-app.vercel.app/api/input', // Endpoint xử lý DTMF
      submitOnHash: true, // Gửi khi khách hàng nhấn '#'
      timeout: 15, // Đợi tối đa 15 giây
      maxLength: 2, // Giới hạn tối đa 2 ký tự
    },
  ];

  return NextResponse.json(scco);
}