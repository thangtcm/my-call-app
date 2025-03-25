import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface AuthRequestBody {
  userId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: AuthRequestBody = await request.json();
  const apiKey = process.env.STRINGEE_API_KEY as string;
  const secretKey = process.env.STRINGEE_SECRET_KEY as string;
  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing STRINGEE_API_KEY or STRINGEE_SECRET_KEY' },
      { status: 500 }
    );
  }
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: "HS256", cty: "stringee-api;v=1" };
  const payload = {
    jti: apiKey + '-' + now,
    iss: apiKey,
    exp: now + 3600,
    rest_api: true
  };

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', header: header });

  return NextResponse.json({ token }, { status: 200 });
}