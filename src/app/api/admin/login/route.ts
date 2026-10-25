import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

// パスワード総当たり対策: 同じIPから15分に5回失敗したら、15分間ログインを受け付けない。
// 成功したらそのIPのカウントは消す。
// インメモリのため、Netlify の関数インスタンスごとに別カウントになる（完全な対策ではない）
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;
const failures = new Map<string, { count: number; resetAt: number }>();

function getClientIP(req: NextRequest): string {
  // x-forwarded-for の先頭はクライアントが自由に書けるので、Netlify が付ける接続元IPを優先する
  return (
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** ロック中なら解除までの秒数、そうでなければ null */
function lockedSeconds(ip: string, now: number): number | null {
  const entry = failures.get(ip);
  if (!entry) return null;
  if (now >= entry.resetAt) {
    failures.delete(ip);
    return null;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.resetAt - now) / 1000) : null;
}

function recordFailure(ip: string, now: number) {
  const entry = failures.get(ip);
  if (!entry || now >= entry.resetAt) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

/** 長さや一致した位置で応答時間が変わらないよう、ハッシュをそろえてから比べる */
function matchesPassword(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN;

  if (!ADMIN_PASSWORD || !ADMIN_SESSION_TOKEN) {
    return NextResponse.json(
      { error: 'Admin is not configured' },
      { status: 500 }
    );
  }

  const ip = getClientIP(req);
  const now = Date.now();
  const retryAfter = lockedSeconds(ip, now);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: `ログインの失敗が続いたため、${Math.ceil(retryAfter / 60)}分ほど待ってから再度お試しください` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof password !== 'string' || !matchesPassword(password, ADMIN_PASSWORD)) {
    recordFailure(ip, now);
    return NextResponse.json(
      { error: 'パスワードが正しくありません' },
      { status: 401 }
    );
  }

  failures.delete(ip);

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
