/**
 * しおり画面「情報」タブの関連記事セクションから呼ばれる。
 *
 * queries.ts は server-only のためクライアントから直接 import できない。
 * この Route Handler を挟むことで、microCMS の API キーをブラウザに出さずに記事を渡す。
 */
import { NextResponse } from "next/server";
import { getPostsByDestination } from "@/lib/microcms/queries";
import { toSummary } from "@/lib/microcms/mappers";

export const revalidate = 3600;

const MAX_LIMIT = 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : 3;

  if (!destination) {
    return NextResponse.json({ posts: [] });
  }

  try {
    const posts = await getPostsByDestination(destination, limit);
    return NextResponse.json({ posts: posts.map(toSummary) });
  } catch (error) {
    console.error("[blog] 関連記事の取得に失敗しました", error);
    // 情報タブの主機能（予約情報の管理）を妨げないよう、失敗時も空配列で返す
    return NextResponse.json({ posts: [] });
  }
}
