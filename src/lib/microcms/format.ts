/**
 * 読了時間・日付の整形ユーティリティ。
 *
 * 重要: このファイルはクライアントコンポーネント（RelatedArticles など）からも
 * import するため、`server-only` を付けてはいけない。
 * microCMS の認証情報に触れる処理をここに書かないこと。
 */
import type { ArticleBody } from "./types";

/** 日本語の平均読字速度。1分あたりの文字数 */
const CHARS_PER_MINUTE = 500;

/** HTML タグとエンティティを除去して本文の文字数を数えるための素朴な変換 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

export function countBodyChars(body: ArticleBody): number {
  if (body.format === "html") {
    return stripHtml(body.html).length;
  }

  return body.blocks.reduce((total, block) => {
    switch (block.type) {
      case "list":
        return total + block.items.join("").length;
      case "price":
        return (
          total +
          block.figure.label.length +
          block.figure.value.length +
          (block.figure.note?.length ?? 0)
        );
      default:
        return total + block.text.length;
    }
  }, 0);
}

/** 本文の文字数から読了時間（分）を見積もる。最低1分 */
export function estimateReadingMinutes(body: ArticleBody): number {
  return Math.max(1, Math.round(countBodyChars(body) / CHARS_PER_MINUTE));
}

/** 表示用の日付。例: 2026年8月24日 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

/** `<time dateTime>` 用の YYYY-MM-DD */
export function toDateAttribute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** 表示用の年月。例: 2026年8月 */
export function formatYearMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

/** これを超えて棚卸しされていない料金情報は、古い可能性がある旨を強めに出す */
export const PRICE_STALE_AFTER_MONTHS = 6;

/**
 * 料金の調査時点が古くなっていないか。
 * 「金額を出すなら定期的に棚卸しする」という編集方針を、読者にも運営にも見える形にするため。
 */
export function isPriceStale(
  surveyedAtIso: string,
  now: Date = new Date()
): boolean {
  const surveyedAt = new Date(surveyedAtIso);
  if (Number.isNaN(surveyedAt.getTime())) return false;

  const threshold = new Date(surveyedAt);
  threshold.setMonth(threshold.getMonth() + PRICE_STALE_AFTER_MONTHS);
  return now > threshold;
}

/**
 * microCMS の画像URLに変換パラメータを付ける。
 * microCMS 以外のURL（シードデータの Unsplash など）はそのまま返す。
 */
export function optimizedImageUrl(url: string, width: number): string {
  if (!url.includes("images.microcms-assets.io")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}w=${width}&fm=webp&q=80`;
}
