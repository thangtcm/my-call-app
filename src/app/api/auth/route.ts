import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthRequestBody {
  userId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: AuthRequestBody = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const apiKey = process.env.STRINGEE_API_KEY as string;
  const secretKey = process.env.STRINGEE_SECRET_KEY as string;
  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing STRINGEE_API_KEY or STRINGEE_SECRET_KEY' },
      { status: 500 }
    );
  }
  const payload = {
    jti: apiKey + '-' + Date.now(),
    iss: apiKey,
    userId,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

  return NextResponse.json({ token }, { status: 200 });
}