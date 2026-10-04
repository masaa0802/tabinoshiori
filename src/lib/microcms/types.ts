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
 * 金額・相場を示すデータ。
 *
 * 編集方針により、金額を出すときは出典と調査時点の併記が必須。
 * そのため `source` と `surveyedAt` は省略可能にしていない（型で強制する）。
 */
export type PriceFigure = {
  /** 何の金額か。例: 東京→台北の往復航空券（1月中旬） */
  label: string;
  /** 金額・相場。例: 3万〜4万円 */
  value: string;
  /** 出典。例: 各航空会社の公式サイト */
  source: string;
  /** 出典URL */
  sourceUrl?: string;
  /** 調査時点。例: 2026年8月 */
  surveyedAt: string;
  /** 条件の補足。例: 直行便・受託手荷物なしの最安運賃 */
  note?: string;
  /** 根拠となる画像（検索結果のスクリーンショットなど） */
  image?: BlogImage & { alt: string; caption?: string };
};

/**
 * シードデータ用の本文ブロック。
 * microCMS のリッチエディタは HTML 文字列を返すため、実記事の入稿後は使わなくなる。
 */
export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "price"; figure: PriceFigure };

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
  /**
   * 下書きかどうか。microCMS で一度も公開されていないコンテンツが true。
   *
   * 一覧取得は公開済みしか返さないため、一覧では常に false。
   * `draftKey` 付きで取得したとき（画面プレビュー）だけ true になりうる。
   */
  isDraft: boolean;
  /**
   * 記事内の料金・相場をいつ調べたか（ISO8601）。
   * 金額を含む記事は必ず設定する。設定すると記事冒頭に注釈バナーが出る。
   */
  priceCheckedAt?: string;
  /** 料金の出典。記事冒頭の注釈バナーに列挙する */
  priceSources: string[];
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
