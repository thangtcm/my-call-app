import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // Số khách hàng
  const to = searchParams.get('to');     // Số tổng đài
  const uuid = searchParams.get('uuid'); // ID cuộc gọi
  const fromInternal = searchParams.get('fromInternal'); // Cờ từ nội bộ hay ngoài

  // Kiểm tra tham số cần thiết
  if (!from || !to || !uuid) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // SCCO để tự động trả lời bằng TTS
  const scco = [
    {
      action: 'talk',
      text: `Xin chào ${from}, cảm ơn bạn đã gọi tới tổng đài của chúng tôi.`,
      voice: 'hn_female_thutrang_phrase_48k-hsmm', // Giọng nữ Hà Nội
      bargeIn: true, // Cho phép khách hàng ngắt lời
      speed: 1.0, // Tốc độ giọng nói
    },
  ];

  // Trả về SCCO dưới dạng JSON
  return NextResponse.json(scco);
}