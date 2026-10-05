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
 * お土産ガイドの1品。
 *
 * 記事に紐づけると、記事内にジャンル別の一覧（お土産ガイド）が出る。
 * 読者が一目で分かるようにしたいのは「日本でも買えるか」「どこで買えるか」
 * 「いつ時点の情報か」の3点で、いずれもカード上に必ず表示する。
 *
 * 価格は PriceFigure と同じ方針で、確認日（`checkedAt`）を省略できない。
 */
export type Souvenir = {
  id: string;
  name: string;
  /** ジャンル。記事内ではこの単位で見出しと目次（JUMP TO）が作られる。例: お菓子 */
  genre: string;
  /** 表示用の価格。例: 1箱10個入り 約1,500円 */
  price: string;
  /** ひとことコメント */
  comment?: string;
  /** 買える場所（店名・エリア）。例: 迪化街の乾物店 */
  place: string;
  /** 地図リンクを正確にするための住所。省略時は `place` で検索する */
  address?: string;
  placeId?: string;
  /** 日本国内でも手に入るか。false のものは「現地でしか買えない」と表示する */
  availableInJapan: boolean;
  /** 日本で買えるお店のURL */
  japanUrl?: string;
  /**
   * `japanUrl` が広告（アフィリエイト）リンクか。
   * true のときボタンの横に「PR」と表示し、rel="sponsored" を付ける。
   * ステルスマーケティング規制（景品表示法）への対応のため、広告リンクなら必ず立てる。
   */
  sponsored: boolean;
  /** 価格・販売場所を最後に確認した日（ISO8601） */
  checkedAt: string;
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
  /** お土産ガイドに並べる品。空なら記事内にガイドを出さない */
  souvenirs: Souvenir[];
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
