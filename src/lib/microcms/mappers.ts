/**
 * microCMS のレスポンスをアプリ側のドメイン型へ変換する。
 *
 * フィールド名は microcms/schemas/*.json と対応させている。
 * スキーマを変更したときは、こちらも必ず合わせて更新すること。
 */
import type {
  BlogImage,
  BlogPost,
  BlogPostSummary,
  Category,
  Spot,
} from "./types";
import { estimateReadingMinutes } from "./format";

/** microCMS のコンテンツに共通で付くシステムフィールド */
type MicroCMSMeta = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
};

type MicroCMSImageField = {
  url: string;
  width?: number;
  height?: number;
};

export type MicroCMSCategory = MicroCMSMeta & {
  name?: string;
  slug?: string;
  description?: string;
  order?: number;
};

export type MicroCMSSpot = MicroCMSMeta & {
  name?: string;
  description?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  address?: string;
  activityType?: string;
  photo?: MicroCMSImageField;
};

export type MicroCMSBlog = MicroCMSMeta & {
  title?: string;
  excerpt?: string;
  coverImage?: MicroCMSImageField;
  body?: string;
  category?: MicroCMSCategory;
  /** microCMS に文字列配列型がないため、カンマ区切りのテキストで入稿する */
  tags?: string;
  /** 同上 */
  destination?: string;
  spots?: MicroCMSSpot[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: MicroCMSImageField;
  featured?: boolean;
  /** 料金・相場を調べた日 */
  priceCheckedAt?: string;
  /** 料金の出典。カンマ区切りテキスト */
  priceSources?: string;
};

/**
 * カンマ区切りテキストを配列にする。
 * 半角カンマ・全角読点・改行のいずれでも区切れるようにしている
 * （入稿時の表記ゆれを吸収するため）。
 */
export function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,、\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toImage(image?: MicroCMSImageField): BlogImage | undefined {
  if (!image?.url) return undefined;
  return { url: image.url, width: image.width, height: image.height };
}

/** カテゴリが未設定の記事でも一覧が壊れないようにするためのフォールバック */
const UNCATEGORIZED: Category = {
  id: "uncategorized",
  slug: "uncategorized",
  name: "未分類",
};

export function toCategory(raw?: MicroCMSCategory | null): Category {
  if (!raw) return UNCATEGORIZED;
  return {
    id: raw.id,
    // slug 未入力のコンテンツでも URL が作れるよう、コンテンツIDにフォールバックする
    slug: raw.slug?.trim() || raw.id,
    name: raw.name?.trim() || "未分類",
    description: raw.description?.trim() || undefined,
    order: raw.order,
  };
}

export function toSpot(raw: MicroCMSSpot): Spot {
  return {
    id: raw.id,
    name: raw.name?.trim() || "",
    description: raw.description?.trim() || "",
    placeId: raw.placeId?.trim() || undefined,
    lat: raw.lat,
    lng: raw.lng,
    address: raw.address?.trim() || undefined,
    activityType: raw.activityType?.trim() || undefined,
    photo: toImage(raw.photo),
  };
}

export function toBlogPost(raw: MicroCMSBlog): BlogPost {
  return {
    // microCMS のコンテンツIDをそのまま記事URLのスラッグに使う
    id: raw.id,
    slug: raw.id,
    title: raw.title?.trim() || "（タイトル未設定）",
    excerpt: raw.excerpt?.trim() || "",
    coverImage: toImage(raw.coverImage),
    body: { format: "html", html: raw.body ?? "" },
    category: toCategory(raw.category),
    tags: splitList(raw.tags),
    destinations: splitList(raw.destination),
    spots: (raw.spots ?? []).map(toSpot),
    seoTitle: raw.seoTitle?.trim() || undefined,
    seoDescription: raw.seoDescription?.trim() || undefined,
    ogImage: toImage(raw.ogImage),
    publishedAt: raw.publishedAt ?? raw.createdAt,
    updatedAt: raw.revisedAt ?? raw.updatedAt,
    featured: Boolean(raw.featured),
    priceCheckedAt: raw.priceCheckedAt || undefined,
    priceSources: splitList(raw.priceSources),
  };
}

/** クライアントへ渡す最小限の形に落とす（API レスポンス用） */
export function toSummary(post: BlogPost): BlogPostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    categoryName: post.category.name,
    categorySlug: post.category.slug,
    readingMinutes: estimateReadingMinutes(post.body),
  };
}
