import { NextRequest, NextResponse } from 'next/server';

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT!;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

// 許可する分析クエリのオペレーション名
const ALLOWED_OPERATIONS = new Set([
  'DashboardStats',
  'DestinationStats', // 目的地・旅の目的を含むitinerary一覧
  'PurposeStats',
  'TrendStats',
]);

export async function POST(req: NextRequest) {
  // 1. 管理画面セッション検証
  const session = req.cookies.get('admin_session');
  const validToken = process.env.ADMIN_SESSION_TOKEN;

  if (!session || !validToken || session.value !== validToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    return NextResponse.json(
      { error: 'GraphQL endpoint is not configured' },
      { status: 500 }
    );
  }

  const body = await req.json();

  // 2. mutation を完全ブロック
  if (
    typeof body.query === 'string' &&
    /^\s*mutation\b/i.test(body.query)
  ) {
    return NextResponse.json(
      { error: 'Forbidden: mutation not allowed' },
      { status: 403 }
    );
  }

  // 3. 許可オペレーション名のみ通過
  if (!ALLOWED_OPERATIONS.has(body.operationName)) {
    return NextResponse.json(
      { error: 'Forbidden: operation not allowed' },
      { status: 403 }
    );
  }

  // 4. Hasura へ転送
  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
