import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN;

  if (!ADMIN_PASSWORD || !ADMIN_SESSION_TOKEN) {
    return NextResponse.json(
      { error: 'Admin is not configured' },
      { status: 500 }
    );
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'パスワードが正しくありません' },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', ADMIN_SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7日間
    path: '/',
  });
  return res;
}
