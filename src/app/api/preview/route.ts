/**
 * microCMS の「画面プレビュー」から下書きを開くための入口。
 *
 * 一覧取得では下書きを取れないため、下書きの確認はこの経路だけ。
 * microCMS が記事ごとに発行する `draftKey` を受け取り、Next.js の Draft Mode を
 * 有効にしてから記事ページへ転送する。
 *
 * microCMS 側の設定（API設定 → 画面プレビュー）に入れるURL:
 *
 *   https://tabinoshiori.jp/api/preview?secret=<MICROCMS_PREVIEW_SECRET>&contentId={CONTENT_ID}&draftKey={DRAFT_KEY}
 *
 * `{CONTENT_ID}` と `{DRAFT_KEY}` は microCMS が置き換える。
 *
 * Draft Mode の有効・無効は Cookie 単位で、押した本人にしか効かない。
 * 公開ページの静的キャッシュは汚れないので、下書きが他の人に見えることはない。
 */
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getPostBySlug } from "@/lib/microcms/queries";

/** 長さが違うと timingSafeEqual が例外を投げるため、先に弾く */
function matchesSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.MICROCMS_PREVIEW_SECRET;

  // シークレット未設定ならプレビュー機能そのものを無効にする。
  // 設定し忘れたまま誰でも Draft Mode を有効にできる状態を作らないため。
  if (!expectedSecret) {
    return new NextResponse("Preview is not configured", { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const contentId = searchParams.get("contentId");
  const draftKey = searchParams.get("draftKey");

  if (!secret || !matchesSecret(secret, expectedSecret)) {
    return new NextResponse("Invalid secret", { status: 401 });
  }

  if (!contentId) {
    return new NextResponse("contentId is required", { status: 400 });
  }

  // contentId はそのままURLのパスになる。外部から渡る値なので、
  // microCMS のコンテンツIDとして正当な文字だけに絞る。
  // これをしないと `../` などを入れられて別のパスへ飛ばされる。
  if (!/^[a-zA-Z0-9_-]+$/.test(contentId)) {
    return new NextResponse("Invalid contentId", { status: 400 });
  }

  // 公開済みで下書きが無い記事は microCMS が draftKey を空で渡してくる。
  // エラーにせず通常の記事ページへ送る。プレビューする下書きが無いだけなので
  if (!draftKey) {
    return NextResponse.redirect(
      new URL(`/blog/${contentId}`, request.nextUrl.origin)
    );
  }

  // 転送する前に、実際に取得できるかここで確かめる。
  // 確かめずに転送すると、記事ページ側で素っ気ない404になり、
  // draftKey が無効なのか権限が足りないのかが分からなくなる。
  const post = await getPostBySlug(contentId, draftKey);
  if (!post) {
    return new NextResponse(
      [
        `下書きを取得できませんでした（contentId: ${contentId}）`,
        "",
        "考えられる原因:",
        "- draftKey が古い（記事を保存し直すと新しいキーが発行される）",
        "- APIキーに下書きを取得する権限が無い",
        "- contentId が違う",
      ].join("\n"),
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  (await draftMode()).enable();

  return NextResponse.redirect(
    new URL(
      `/blog/${contentId}?draftKey=${encodeURIComponent(draftKey)}`,
      request.nextUrl.origin
    )
  );
}
