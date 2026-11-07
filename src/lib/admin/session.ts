/**
 * 管理画面のログイン（admin_session Cookie）を確かめる。
 *
 * src/proxy.ts でも確認しているが、サーバー側でデータを返すページや
 * Route Handler では、それぞれでも確かめる（/api/admin/graphql と同じ方針）。
 * middleware が効かない構成になっても、データが外に出ないようにするため。
 */
import "server-only";
import { cookies } from "next/headers";

export async function isAdminSession(): Promise<boolean> {
  const session = (await cookies()).get("admin_session")?.value;
  const validToken = process.env.ADMIN_SESSION_TOKEN;
  return Boolean(session && validToken && session === validToken);
}
