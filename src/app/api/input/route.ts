import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const dtmf = body.dtmf; // Giá trị khách hàng nhập (1, 2, v.v.)
  const from = body.from; // Số khách hàng
  const callId = body.call_id; // ID cuộc gọi

  let scco = [];

  if (dtmf === '1') {
    // Nhấn 1: Kiểm tra đơn hàng
    scco = [
      {
        action: 'talk',
        text: 'Đơn hàng của bạn đang được giao. Cảm ơn bạn đã sử dụng dịch vụ!',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
        speed: 1.0,
      },
    ];
  } else if (dtmf === '2') {
    // Nhấn 2: Chuyển tới agent
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
          number: 'agent_001', // Thay bằng userId của agent thực tế
          alias: 'Agent 001',
        },
      },
    ];
  } else {
    // Nhập sai: Yêu cầu nhập lại
    scco = [
      {
        action: 'talk',
        text: 'Lựa chọn không hợp lệ. Vui lòng nhấn 1 để kiểm tra đơn hàng, nhấn 2 để gặp nhân viên, sau đó nhấn phím thăng.',
        voice: 'hn_female_thutrang_phrase_48k-hsmm',
        bargeIn: true,
      },
      {
        action: 'input',
        eventUrl: 'https://my-call-app.vercel.app/api/input',
        submitOnHash: true,
        timeout: 15,
        maxLength: 2,
      },
    ];
  }

  return NextResponse.json(scco);
}