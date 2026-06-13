/**
 * 管理画面専用 GraphQL クライアント
 *
 * - クライアントコンポーネントから呼ぶ場合: adminQuery() → /api/admin/graphql 経由
 * - サーバーコンポーネントから呼ぶ場合: adminQueryServer() → Hasura 直接（read-only）
 */

// ─── クライアントサイド用 ───────────────────────────────────────────────────────

export async function adminQuery<T>(
  operationName: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch('/api/admin/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName, query, variables }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `GraphQL error: ${res.status}`);
  }

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data as T;
}

// ─── サーバーサイド用（RSC専用） ────────────────────────────────────────────────

const ALLOWED_SERVER_OPERATIONS = new Set([
  'DashboardStats',
  'DestinationStats',
  'PurposeStats',
  'TrendStats',
]);

export async function adminQueryServer<T>(
  operationName: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const HASURA_ENDPOINT =
    process.env.HASURA_GRAPHQL_ENDPOINT ??
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
  const HASURA_ADMIN_SECRET =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET ??
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET;

  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    throw new Error('Hasura is not configured');
  }

  // mutation ブロック（サーバー側でも二重チェック）
  if (/^\s*mutation\b/i.test(query)) {
    throw new Error('Forbidden: mutation not allowed');
  }

  if (!ALLOWED_SERVER_OPERATIONS.has(operationName)) {
    throw new Error('Forbidden: operation not allowed');
  }

  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ operationName, query, variables }),
    cache: 'no-store',
  });

  const json = await res.json();
  if (json.errors?.length) {
    console.error(`[adminQueryServer] ${operationName} errors:`, json.errors);
    throw new Error(json.errors[0].message);
  }
  if (!json.data) {
    console.error(`[adminQueryServer] ${operationName} empty response:`, json);
    throw new Error('Empty response from Hasura');
  }
  return json.data as T;
}
