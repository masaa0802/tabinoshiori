/**
 * 記事取得。**CMS の切り替えはこのファイル内で完結する。**
 *
 * 重要: `server-only` を付けている（client.ts 経由で API キーに触れるため）。
 * クライアントコンポーネントから記事を取得する場合は、このファイルを直接 import せず
 * `/api/blog/related` のような Route Handler を経由すること。直接 import するとビルドが落ちる。
 *
 * フォールバック: MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が未設定なら
 * src/data/blogPosts.ts のシードデータを返す。実記事の入稿後はこの分岐ごと削除する。
 */
import "server-only";
import { isMicroCMSConfigured, microcmsClient, MICROCMS_ENDPOINTS } from "./client";
import { toBlogPost, toCategory, type MicroCMSBlog, type MicroCMSCategory } from "./mappers";
import type { BlogPost, Category } from "./types";
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
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!isMicroCMSConfigured || !microcmsClient) {
    warnOnceAboutSeedData();
    return sortByPublishedAtDesc(seedPosts);
  }

  const response = await microcmsClient.getList<MicroCMSBlog>({
    endpoint: MICROCMS_ENDPOINTS.blogs,
    queries: { limit: FETCH_LIMIT, orders: "-publishedAt" },
  });

  return sortByPublishedAtDesc(response.contents.map(toBlogPost));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isMicroCMSConfigured || !microcmsClient) {
    warnOnceAboutSeedData();
    return seedPosts.find((post) => post.slug === slug) ?? null;
  }

  try {
    const content = await microcmsClient.getListDetail<MicroCMSBlog>({
      endpoint: MICROCMS_ENDPOINTS.blogs,
      contentId: slug,
    });
    return toBlogPost(content);
  } catch {
    // 存在しないコンテンツIDは 404 が返るため、null に丸めて notFound() に委ねる
    return null;
  }
}

export async function getAllCategories(): Promise<Category[]> {
  if (!isMicroCMSConfigured || !microcmsClient) {
    warnOnceAboutSeedData();
    return [...seedCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const response = await microcmsClient.getList<MicroCMSCategory>({
    endpoint: MICROCMS_ENDPOINTS.categories,
    queries: { limit: FETCH_LIMIT, orders: "order" },
  });

  return response.contents.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getAllCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getPostsByCategory(slug: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category.slug === slug);
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
