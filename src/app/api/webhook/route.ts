import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';

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

    // Chuyển Readable stream thành Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioResponse as Readable) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Trả về Buffer dưới dạng Base64
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json(
      {
        message: `Call can be triggered from ${fromUserId} to ${toUserId}`,
        audio: `data:audio/mpeg;base64,${audioBase64}`, // Data URL
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error.message);
    const errorMessage = error.message || 'Something went wrong';
    return NextResponse.json({ error: 'Something went wrong', details: errorMessage }, { status: 500 });
  }
}