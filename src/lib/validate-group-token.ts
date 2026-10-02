/**
 * サーバーサイドのグループトークン検証ユーティリティ
 * Hasura に直接クエリして token の存在を確認する
 */

// 5分間のインメモリキャッシュ（サーバー再起動でクリア）
const tokenCache = new Map<string, { valid: boolean; expiresAt: number }>();

export async function validateGroupToken(token: string): Promise<boolean> {
  const HASURA_ENDPOINT =
    process.env.HASURA_GRAPHQL_ENDPOINT ??
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
  const HASURA_ADMIN_SECRET =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) return false;

  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && now < cached.expiresAt) return cached.valid;

  try {
    const res = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `query ValidateToken($token: String!) {
          groups(where: { token: { _eq: $token } }) { id }
        }`,
        variables: { token },
      }),
    });

    const data = await res.json();
    const valid =
      Array.isArray(data?.data?.groups) && data.data.groups.length > 0;

    tokenCache.set(token, { valid, expiresAt: now + 5 * 60_000 });
    return valid;
  } catch {
    return false;
  }
}
