import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const recordingUrl = body.recordingUrl; // URL ghi âm từ Stringee
  const callId = body.call_id;

  console.log('Recording URL:', { callId, recordingUrl });

  return NextResponse.json({ message: 'Recording received' });
}