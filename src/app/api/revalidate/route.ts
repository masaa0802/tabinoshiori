/**
 * microCMS の webhook 受け口。
 * 記事の公開・更新・削除時に該当ページを再生成する。
 *
 * 署名検証: microCMS は本文の HMAC-SHA256 を X-MICROCMS-Signature ヘッダーで送ってくる。
 * 検証に使うのは「受信した生のリクエストボディ」であり、JSON.parse 後の再文字列化ではない。
 */
import crypto from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const SIGNATURE_HEADER = "x-microcms-signature";

function isValidSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  // timingSafeEqual は長さが違うと例外を投げるため、先に長さを比べる
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** webhook のペイロードから対象記事のコンテンツIDを取り出す */
function extractContentId(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  const contents = (payload as { contents?: unknown }).contents;
  if (typeof contents !== "object" || contents === null) return null;

  // 公開・更新は new、削除は old に入る
  for (const key of ["new", "old"] as const) {
    const entry = (contents as Record<string, unknown>)[key];
    if (typeof entry === "object" && entry !== null) {
      const id = (entry as { id?: unknown }).id;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const secret = process.env.MICROCMS_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[blog] MICROCMS_WEBHOOK_SECRET が未設定のため webhook を拒否しました。");
    return NextResponse.json(
      { revalidated: false, message: "webhook secret is not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER);
  const rawBody = await request.text();

  if (!signature || !isValidSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { revalidated: false, message: "invalid signature" },
      { status: 401 }
    );
  }

  let contentId: string | null = null;
  try {
    contentId = extractContentId(JSON.parse(rawBody));
  } catch {
    // 本文が JSON でなくても、署名が正しい以上は一覧の再生成だけは行う
    contentId = null;
  }

  const revalidated = ["/blog", "/", "/sitemap.xml"];
  if (contentId) {
    revalidated.push(`/blog/${contentId}`);
  }

  for (const path of revalidated) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths: revalidated });
}
