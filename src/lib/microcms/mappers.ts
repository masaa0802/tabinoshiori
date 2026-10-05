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
  Souvenir,
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

export type MicroCMSSouvenir = MicroCMSMeta & {
  name?: string;
  genre?: string;
  price?: string;
  priceYen?: number;
  comment?: string;
  place?: string;
  address?: string;
  placeId?: string;
  availableInJapan?: boolean;
  japanUrl?: string;
  sponsored?: boolean;
  /** 価格・販売場所を確認した日 */
  checkedAt?: string;
  photo?: MicroCMSImageField;
};

export type MicroCMSBlog = MicroCMSMeta & {
  title?: string;
  excerpt?: string;
  coverImage?: MicroCMSImageField;
  body?: string;
  category?: MicroCMSCategory;
  /**
   * 不安タグ。microCMS 側はセレクトフィールド（複数選択）なので配列で返る。
   * 以前はカンマ区切りテキストだったため、移行前のデータや
   * 単一選択に設定された場合に備えて文字列も受け付ける。
   */
  tags?: string[] | string;
  /** 自由タグ。一覧ページを持たない表示専用。カンマ区切りテキスト */
  freeTags?: string;
  /** microCMS に文字列配列型がないため、カンマ区切りのテキストで入稿する */
  destination?: string;
  spots?: MicroCMSSpot[];
  souvenirs?: MicroCMSSouvenir[];
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

/**
 * 不安タグ（セレクト）と自由タグ（テキスト）を1つの配列にまとめる。
 *
 * アプリ側は BlogPost.tags の1本だけを見れば済むようにしてある。
 * 不安タグか自由タグかの判別は tags.ts の ANXIETY_TAGS との完全一致で行うため、
 * ここで混ぜても区別は失われない。重複は先に出たほうを残す。
 */
export function toTagList(
  anxiety?: string[] | string | null,
  free?: string | null
): string[] {
  const selected = Array.isArray(anxiety)
    ? anxiety.map((item) => item.trim()).filter((item) => item.length > 0)
    : splitList(anxiety);
  return [...new Set([...selected, ...splitList(free)])];
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

/** ジャンル未入力の品をまとめる見出し */
const UNGROUPED_GENRE = "その他";

export function toSouvenir(raw: MicroCMSSouvenir): Souvenir {
  return {
    id: raw.id,
    name: raw.name?.trim() || "",
    genre: raw.genre?.trim() || UNGROUPED_GENRE,
    price: raw.price?.trim() || "",
    priceYen: typeof raw.priceYen === "number" ? raw.priceYen : undefined,
    comment: raw.comment?.trim() || undefined,
    place: raw.place?.trim() || "",
    address: raw.address?.trim() || undefined,
    placeId: raw.placeId?.trim() || undefined,
    availableInJapan: Boolean(raw.availableInJapan),
    japanUrl: raw.japanUrl?.trim() || undefined,
    sponsored: Boolean(raw.sponsored),
    // スキーマでは必須。入れ忘れた古いデータでも日付が消えないよう、
    // コンテンツ自体の最終更新日で代用する（確認日より新しくなることはあっても古くはならない）
    checkedAt: raw.checkedAt || raw.revisedAt || raw.updatedAt,
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
    tags: toTagList(raw.tags, raw.freeTags),
    destinations: splitList(raw.destination),
    spots: (raw.spots ?? []).map(toSpot),
    souvenirs: (raw.souvenirs ?? []).map(toSouvenir),
    seoTitle: raw.seoTitle?.trim() || undefined,
    seoDescription: raw.seoDescription?.trim() || undefined,
    ogImage: toImage(raw.ogImage),
    publishedAt: raw.publishedAt ?? raw.createdAt,
    updatedAt: raw.revisedAt ?? raw.updatedAt,
    // publishedAt は一度も公開されていないコンテンツには付かない。
    // 公開済みで未公開の編集がある場合（PUBLISH_AND_DRAFT）は publishedAt が
    // 付くので公開扱いになる。記事自体は公開されているため、それでよい。
    isDraft: !raw.publishedAt,
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
