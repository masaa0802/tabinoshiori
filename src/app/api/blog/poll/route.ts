/**
 * 記事末アンケートの結果の取得（GET）と投票（POST）。
 *
 * 記事の本文を読み直して、アンケートが本当にその記事にあるか・選択肢の番号が
 * 範囲内かを確かめてから数える。存在しない記事やアンケートの票で
 * 保存先が埋まらないようにするため。
 *
 * 投票した人を特定する情報（IP・Cookie など）は受け取らず、保存もしない。
 * 同じ人の重複投票はブラウザ側（localStorage）で防ぐだけの簡易なもの。
 *
 * microCMS の下書きプレビューからは draftKey が付いてくる。そのときは下書きの本文で
 * アンケートを確かめ、票は本番のドメインでもプレビュー用のストアに入れる（pollStore.ts）。
 */
import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/microcms/queries";
import { extractPoll, type ReaderPoll } from "@/lib/microcms/poll";
import { addPollVote, readPollCounts } from "@/lib/pollStore";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function findPoll(
  slug: string,
  pollId: string,
  draftKey?: string
): Promise<ReaderPoll | null> {
  if (!slug || !pollId) return null;
  const post = await getPostBySlug(slug, draftKey || undefined);
  if (!post || post.body.format !== "html") return null;
  const { poll } = extractPoll(post.body.html);
  return poll && poll.id === pollId ? poll : null;
}

function hostnameOf(request: Request): string {
  return new URL(request.url).hostname;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  const pollId = searchParams.get("pollId")?.trim() ?? "";
  const draftKey = searchParams.get("draftKey")?.trim() ?? "";

  const poll = await findPoll(slug, pollId, draftKey);
  if (!poll) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  }

  try {
    const counts = await readPollCounts({
      hostname: hostnameOf(request),
      isDraft: Boolean(draftKey),
      slug,
      pollId,
      optionCount: poll.options.length,
    });
    return NextResponse.json({ counts }, { headers: NO_STORE });
  } catch (error) {
    console.error("[blog] アンケート結果の取得に失敗しました", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  let body: { slug?: unknown; pollId?: unknown; option?: unknown; draftKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400, headers: NO_STORE });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const pollId = typeof body.pollId === "string" ? body.pollId.trim() : "";
  const option = typeof body.option === "number" ? body.option : NaN;
  const draftKey = typeof body.draftKey === "string" ? body.draftKey.trim() : "";

  const poll = await findPoll(slug, pollId, draftKey);
  if (!poll) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  }
  if (!Number.isInteger(option) || option < 0 || option >= poll.options.length) {
    return NextResponse.json({ error: "bad_request" }, { status: 400, headers: NO_STORE });
  }

  try {
    const counts = await addPollVote({
      hostname: hostnameOf(request),
      isDraft: Boolean(draftKey),
      slug,
      pollId,
      optionCount: poll.options.length,
      option,
      question: poll.question,
      options: poll.options,
    });
    return NextResponse.json({ counts }, { headers: NO_STORE });
  } catch (error) {
    console.error("[blog] アンケートの投票に失敗しました", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
