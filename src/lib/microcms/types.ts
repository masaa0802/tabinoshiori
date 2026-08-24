/**
 * ブログ機能で扱うドメイン型。
 * microCMS のレスポンス形状ではなく、アプリ側で使いやすい形に正規化した型を定義する。
 * microCMS レスポンスからの変換は mappers.ts が担当する。
 */

export type BlogImage = {
  url: string;
  width?: number;
  height?: number;
};

export type Category = {
  /** microCMS のコンテンツID。URLスラッグとしても使う */
  id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
};

export type Spot = {
  id: string;
  name: string;
  description: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  address?: string;
  /** 観光・グルメ・宿泊など */
  activityType?: string;
  photo?: BlogImage;
};

/**
 * シードデータ用の本文ブロック。
 * microCMS のリッチエディタは HTML 文字列を返すため、実記事の入稿後は使わなくなる。
 */
export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

/**
 * 本文の表現。microCMS からは HTML、シードデータからはブロック配列で届く。
 * ArticleBody.tsx がこの format を見て描画方法を出し分ける。
 */
export type ArticleBody =
  | { format: "html"; html: string }
  | { format: "blocks"; blocks: ArticleBlock[] };

export type BlogPost = {
  /** microCMS のコンテンツID。記事URL `/blog/<id>` にそのまま使う */
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: BlogImage;
  body: ArticleBody;
  category: Category;
  tags: string[];
  /** 関連する目的地名。しおりの destination と突き合わせる */
  destinations: string[];
  spots: Spot[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: BlogImage;
  /** ISO8601 */
  publishedAt: string;
  /** ISO8601 */
  updatedAt: string;
  featured: boolean;
};

/** 一覧・カード表示に必要な最小限の情報だけを持つ形（API レスポンス用） */
export type BlogPostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "coverImage" | "publishedAt"
> & {
  categoryName: string;
  categorySlug: string;
  readingMinutes: number;
};
