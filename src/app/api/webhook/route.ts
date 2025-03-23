import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';
import fs from 'fs';
import path from 'path';

interface WebhookRequestBody {
  fromUserId: string;
  toUserId: string;
  text: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: WebhookRequestBody = await request.json();
  const { fromUserId, toUserId, text } = body;

  if (!fromUserId || !toUserId || !text) {
    return NextResponse.json({ error: 'fromUserId, toUserId, and text are required' }, { status: 400 });
  }

  try {
    const elevenLabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY as string,
    });

    const audioResponse = await elevenLabsClient.generate({
      voice: 'Sarah',
      text,
      model_id: 'eleven_monolingual_v1',
    });

    const audioFileName = `audio-${Date.now()}.mp3`;
    const audioFilePath = path.join(process.cwd(), 'public', 'temp', audioFileName);

    const writer = fs.createWriteStream(audioFilePath);
    audioResponse.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const host = request.headers.get('host') || '';
    const audioUrl = `${host.includes('localhost') ? 'http://localhost:3000' : 'https://' + host}/temp/${audioFileName}`;

    // Không dùng WebSocket nữa, chỉ trả về thông tin
    return NextResponse.json(
      { message: `Call can be triggered from ${fromUserId} to ${toUserId}`, audioUrl },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error.message);
    const errorMessage = error.message || 'Something went wrong';
    return NextResponse.json({ error: 'Something went wrong', details: errorMessage }, { status: 500 });
  }
}