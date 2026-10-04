"use client";

/**
 * ブログの効果測定。
 *
 * 目的は「どの記事が旅程作成につながったか」を記事単位で見られるようにすること。
 * ページビューだけでは記事の良し悪しが判断できないため、4段階に分けて測る。
 *
 *   1. 検索で見つかる  … Search Console（コードでは測れない）
 *   2. 読まれる        … blog_article_read
 *   3. CTAを押す       … blog_cta_click
 *   4. 旅程を作る      … itinerary_created（source_article 付き）
 *
 * どこで落ちているかが分かると打ち手が決まる。判断の基準は
 * docs/BLOG_ANALYTICS.md を参照。
 */
import { trackEvent } from "./analytics";

/** CTAをどこで押したか。位置ごとの効き目を比べるために分けている */
export type CtaPosition = "header" | "article_footer" | "blog_top" | "highlight";

/**
 * 記事から来たことを旅程作成まで引き継ぐための保存先。
 *
 * sessionStorage を使うのは、タブを閉じたら消えてよく、かつ
 * /group/new へのページ遷移をまたいで残ってほしいため。
 * localStorage だと何日も前の記事が誤って紐づく。
 */
const SOURCE_KEY = "tabinoshiori:blog_source";

/** 紐付けの有効期限。これを過ぎたら「記事経由ではない」とみなす */
const SOURCE_TTL_MS = 60 * 60 * 1000; // 1時間

type BlogSource = {
  slug: string;
  category: string;
  position: CtaPosition;
  at: number;
};

/** sessionStorage はプライベートモードなどで例外を投げることがある */
function safeSession(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function rememberSource(source: BlogSource): void {
  const storage = safeSession();
  if (!storage) return;
  try {
    storage.setItem(SOURCE_KEY, JSON.stringify(source));
  } catch {
    // 保存できなくても計測が欠けるだけ。利用の妨げにはしない
  }
}

/**
 * 直前に経由した記事を取り出す。
 * 期限切れ・壊れた値は「記事経由ではない」として扱う。
 */
export function readBlogSource(): BlogSource | null {
  const storage = safeSession();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BlogSource>;
    if (typeof parsed.slug !== "string" || typeof parsed.at !== "number") {
      return null;
    }
    if (Date.now() - parsed.at > SOURCE_TTL_MS) return null;
    return {
      slug: parsed.slug,
      category: typeof parsed.category === "string" ? parsed.category : "",
      position:
        typeof parsed.position === "string"
          ? (parsed.position as CtaPosition)
          : "article_footer",
      at: parsed.at,
    };
  } catch {
    return null;
  }
}

/** 紐付けを消す。旅程作成に使ったあと、二重計上しないように呼ぶ */
export function clearBlogSource(): void {
  const storage = safeSession();
  if (!storage) return;
  try {
    storage.removeItem(SOURCE_KEY);
  } catch {
    // 消せなくても期限切れで無効になる
  }
}

/**
 * CTAクリック。記事から旅程作成への入口を押した瞬間。
 * ここで記事を覚えておき、作成完了時に紐づける。
 */
export function trackCtaClick(params: {
  slug?: string;
  category?: string;
  position: CtaPosition;
}): void {
  const { slug = "", category = "", position } = params;

  trackEvent("blog_cta_click", {
    article_slug: slug,
    article_category: category,
    cta_position: position,
  });

  if (slug) {
    rememberSource({ slug, category, position, at: Date.now() });
  }
}

/** 読了（本文の規定位置まで到達）。記事の中身が読まれたかの目安 */
export function trackArticleRead(params: {
  slug: string;
  category: string;
  readingMinutes: number;
}): void {
  trackEvent("blog_article_read", {
    article_slug: params.slug,
    article_category: params.category,
    reading_minutes: params.readingMinutes,
  });
}

/**
 * 記事への送客クリック。どこからブログに入ったかを見る。
 *
 * `from` は入口の種類（しおりの情報タブなど）か、記事ページからの回遊なら
 * 元記事の slug を入れる。
 */
export function trackRelatedClick(params: {
  from: string;
  toSlug: string;
}): void {
  trackEvent("blog_related_click", {
    from: params.from,
    to_slug: params.toSlug,
  });
}
