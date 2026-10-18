/**
 * サーバーサイドのグループトークン検証ユーティリティ
 * Hasura に直接クエリして token に対応するグループを引く
 */

// 5分間のインメモリキャッシュ（サーバー再起動でクリア）。
// グループの id は作成後に変わらないので、token → id の対応をそのまま覚えておける
const tokenCache = new Map<string, { groupId: string | null; expiresAt: number }>();

/**
 * token に対応するグループの id（uuid）を返す。見つからなければ null。
 * /api/graphql はこの id を x-hasura-group-id として Hasura に渡し、
 * group_member ロールの permission でそのグループの行だけに絞らせる
 */
export async function resolveGroupId(token: string): Promise<string | null> {
  const HASURA_ENDPOINT =
    process.env.HASURA_GRAPHQL_ENDPOINT ??
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
  const HASURA_ADMIN_SECRET =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) return null;

  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && now < cached.expiresAt) return cached.groupId;

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
    // 通信エラーや Hasura のエラーはキャッシュしない（一時的な失敗で5分間締め出さないため）
    if (!Array.isArray(data?.data?.groups)) return null;

    const groups: { id: string }[] = data.data.groups;
    // token は UNIQUE だが、念のため1件に定まらないときは拒否する
    const groupId = groups.length === 1 ? groups[0].id : null;

    tokenCache.set(token, { groupId, expiresAt: now + 5 * 60_000 });
    return groupId;
  } catch {
    return null;
  }
}

export async function validateGroupToken(token: string): Promise<boolean> {
  return (await resolveGroupId(token)) !== null;
}
