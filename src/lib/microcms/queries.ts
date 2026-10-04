/**
 * 記事取得。**CMS の切り替えはこのファイル内で完結する。**
 *
 * 重要: `server-only` を付けている（client.ts 経由で API キーに触れるため）。
 * クライアントコンポーネントから記事を取得する場合は、このファイルを直接 import せず
 * `/api/blog/related` のような Route Handler を経由すること。直接 import するとビルドが落ちる。
 *
 * フォールバックは2段階ある。
 * 1. 環境変数が未設定 → src/data/blogPosts.ts のシードデータを返す（ローカル開発用）
 * 2. 環境変数は設定済みだが microCMS の呼び出しが失敗 → 空を返す
 *
 * 2で空にしてシードデータを返さないのは、本番でサンプル記事が公開されるのを防ぐため。
 * サンプル記事にはレイアウト確認用の金額が入っており、事実として出してはいけない。
 *
 * どちらの場合もビルドは通す。CMS の不調でサイト全体（LP・しおりを含む）が
 * デプロイできなくなる事態を避けるため。
 */
import "server-only";
import { cache } from "react";
import { isMicroCMSConfigured, microcmsClient, MICROCMS_ENDPOINTS } from "./client";
import { toBlogPost, toCategory, type MicroCMSBlog, type MicroCMSCategory } from "./mappers";
import type { BlogPost, Category } from "./types";
import { findAnxietyTagBySlug } from "./tags";
import { seedCategories, seedPosts } from "@/data/blogPosts";

/** microCMS の1リクエストあたり取得上限。記事数が増えたらページングを検討する */
const FETCH_LIMIT = 100;

let hasWarnedAboutSeedData = false;

function warnOnceAboutSeedData() {
  if (hasWarnedAboutSeedData) return;
  hasWarnedAboutSeedData = true;
  console.warn(
    "[blog] microCMSの環境変数が未設定のため、ローカルのシードデータを使用しています。"
  );
}

/**
 * microCMS の呼び出しが失敗したときに、ビルドを止めずに記録する。
 *
 * よくある原因:
 * - エンドポイント名が articles / categories / spots になっていない（404）
 * - APIキーの権限が足りない、または失効している（403 / 401）
 * - サービスIDの綴り違い
 */
function reportFetchFailure(endpoint: string, error: unknown): void {
  console.error(
    `[blog] microCMS の ${endpoint} を取得できませんでした。` +
      `エンドポイント名・APIキーの権限・サービスIDを確認してください。`,
    error
  );
}

function sortByPublishedAtDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * 全記事を新着順で取得する。
 *
 * 記事数が数十本の想定のため、カテゴリ・目的地での絞り込みは microCMS の filters ではなく
 * 取得後のメモリ上で行っている。数百本規模になったら filters に切り替えること。
 *
 * `cache()` で包んでいるのは、1ページの描画中に何度呼ばれても microCMS への
 * リクエストを1回に抑えるため。generateMetadata と本体の両方から呼ばれるページや、
 * 内部で本関数を使う getFeaturedPost などを重ねて呼んでも通信は増えない。
 * microCMS はプランごとにAPIリクエスト数の上限があるため、ここは効かせておく。
 */
export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  if (!isMicroCMSConfigured || !microcmsClient) {
    warnOnceAboutSeedData();
    return sortByPublishedAtDesc(seedPosts);
  }

  try {
    const response = await microcmsClient.getList<MicroCMSBlog>({
      endpoint: MICROCMS_ENDPOINTS.articles,
      queries: { limit: FETCH_LIMIT, orders: "-publishedAt" },
    });
    return sortByPublishedAtDesc(response.contents.map(toBlogPost));
  } catch (error) {
    reportFetchFailure(MICROCMS_ENDPOINTS.articles, error);
    return [];
  }
});

/**
 * 1記事を取得する。
 *
 * `draftKey` を渡すと下書きの内容が返る。キーは microCMS が記事ごとに発行する
 * もので、管理画面の「画面プレビュー」から `/api/preview` に渡される。
 * 一覧取得では下書きを取れないため、下書きの確認はこの経路だけ。
 */
export const getPostBySlug = cache(
  async (slug: string, draftKey?: string): Promise<BlogPost | null> => {
    if (!isMicroCMSConfigured || !microcmsClient) {
      warnOnceAboutSeedData();
      return seedPosts.find((post) => post.slug === slug) ?? null;
    }

    try {
      const content = await microcmsClient.getListDetail<MicroCMSBlog>({
        endpoint: MICROCMS_ENDPOINTS.articles,
        contentId: slug,
        ...(draftKey ? { queries: { draftKey } } : {}),
      });
      return toBlogPost(content);
    } catch (error) {
      // 存在しないコンテンツIDは 404。これは notFound() に委ねるだけでよい。
      // 403 や 500 は設定・障害の問題なので、気づけるようにログを残す。
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("404")) {
        reportFetchFailure(`${MICROCMS_ENDPOINTS.articles}/${slug}`, error);
      }
      return null;
    }
  }
);

export const getAllCategories = cache(async (): Promise<Category[]> => {
  if (!isMicroCMSConfigured || !microcmsClient) {
    warnOnceAboutSeedData();
    return [...seedCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  try {
    const response = await microcmsClient.getList<MicroCMSCategory>({
      endpoint: MICROCMS_ENDPOINTS.categories,
      queries: { limit: FETCH_LIMIT, orders: "order" },
    });
    return response.contents.map(toCategory);
  } catch (error) {
    reportFetchFailure(MICROCMS_ENDPOINTS.categories, error);
    return [];
  }
});

/**
 * 公開済みの記事だけを返す。
 *
 * `sitemap.xml` と `feed.xml` は**必ずこちらを使うこと。**
 * 下書きのURLを検索エンジンやRSSリーダーに知らせる経路を作らないため。
 *
 * 現状は一覧取得が公開済みしか返さないので、この絞り込みは実質的に何もしない。
 * 将来「下書き全取得」権限を使うようになったときに効く保険として置いている。
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => !post.isDraft);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getAllCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getPostsByCategory(slug: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category.slug === slug);
}

/**
 * 「不安の種類」タグで絞り込む。カテゴリ（情報の種類）と直交する軸。
 * 判定は tags.ts のラベルとの完全一致。
 */
export async function getPostsByAnxietyTag(slug: string): Promise<BlogPost[]> {
  const tag = findAnxietyTagBySlug(slug);
  if (!tag) return [];

  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.includes(tag.label));
}

/** 注目記事。featured が複数あれば最新のもの、無ければ最新記事を返す */
export async function getFeaturedPost(): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.featured) ?? posts[0] ?? null;
}

/**
 * しおりの目的地に一致する記事を返す。
 * 「京都」に対して destination が「京都」「日本」の記事のように、
 * 部分一致で拾えるよう双方向で包含を判定する。
 */
export async function getPostsByDestination(
  destination: string,
  limit = 3
): Promise<BlogPost[]> {
  const keyword = destination.trim();
  if (!keyword) return [];

  const posts = await getAllPosts();
  const matched = posts.filter((post) =>
    post.destinations.some(
      (value) => value.includes(keyword) || keyword.includes(value)
    )
  );

  return matched.slice(0, limit);
}

/** 記事詳細の下部に出す関連記事。同じ目的地 → 同じカテゴリの順で埋める */
export async function getRelatedPosts(
  post: BlogPost,
  limit = 3
): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const candidates = posts.filter((candidate) => candidate.slug !== post.slug);

  const sameDestination = candidates.filter((candidate) =>
    candidate.destinations.some((value) => post.destinations.includes(value))
  );

  const sameCategory = candidates.filter(
    (candidate) =>
      candidate.category.slug === post.category.slug &&
      !sameDestination.includes(candidate)
  );

  return [...sameDestination, ...sameCategory].slice(0, limit);
}
