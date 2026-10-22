import { NextRequest, NextResponse } from 'next/server';
import { resolveGroupId } from '@/lib/validate-group-token';

const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// Hasura にはこのロールで転送し、permission で x-hasura-group-id のグループの行だけに絞らせる。
// admin secret は「ロールを名乗るため」にだけ使い、admin 権限のままでは転送しない。
// permission の定義は hasura-project/scripts/group-member-permissions.mjs（設計は docs/GROUP_SCOPED_ACCESS.md）
const HASURA_ROLE = 'group_member';

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

  // グループの作成は /api/groups がサーバー側で行うので、ここにトークン不要の操作は無い
  const groupToken = req.headers.get('x-group-token');
  if (!groupToken) {
    return NextResponse.json(
      { errors: [{ message: 'Unauthorized' }] },
      { status: 401 }
    );
  }
  const groupId = await resolveGroupId(groupToken);
  if (!groupId) {
    return NextResponse.json(
      { errors: [{ message: 'Unauthorized: invalid group token' }] },
      { status: 403 }
    );
  }

  const body = await req.text();
  try {
    JSON.parse(body);
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'Invalid request body' }] },
      { status: 400 }
    );
  }

  // クライアントのヘッダーは転送しない（x-hasura-* を名乗られないよう、ここで組み立てたものだけ送る）
  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      'x-hasura-role': HASURA_ROLE,
      'x-hasura-group-id': groupId,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
