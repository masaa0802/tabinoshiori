import { NextRequest, NextResponse } from 'next/server';
import { validateGroupToken } from '@/lib/validate-group-token';

const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// グループ未作成時に呼ばれる操作（トークン不要）
const PUBLIC_OPERATIONS = new Set(['InsertGroup', 'InsertItinerary']);

// シンプルなIPベースのレートリミッター（60req/分）
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 60) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    return NextResponse.json(
      { errors: [{ message: 'GraphQL endpoint is not configured' }] },
      { status: 500 }
    );
  }

  // レート制限
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { errors: [{ message: 'Too many requests' }] },
      { status: 429 }
    );
  }

  const body = await req.text();

  let operationName: string | null = null;
  try {
    const parsed = JSON.parse(body);
    operationName =
      typeof parsed.operationName === 'string' ? parsed.operationName : null;
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'Invalid request body' }] },
      { status: 400 }
    );
  }

  // パブリック操作以外はグループトークン必須
  if (!operationName || !PUBLIC_OPERATIONS.has(operationName)) {
    const groupToken = req.headers.get('x-group-token');
    if (!groupToken) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized' }] },
        { status: 401 }
      );
    }
    const valid = await validateGroupToken(groupToken);
    if (!valid) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized: invalid group token' }] },
        { status: 403 }
      );
    }
  }

  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
