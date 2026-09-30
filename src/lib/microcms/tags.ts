/**
 * 「不安の種類」による分類軸。
 *
 * カテゴリ（情報の種類: 目的地ガイド / 旅の準備 / モデルコース）と直交する軸として、
 * 読者が自分の悩みから記事を探せるようにするために使う。
 *
 * microCMS 側は既存の `tags`（カンマ区切りテキスト）で運用する。
 * 入稿時に下記の `label` と一字一句同じ文字列を入れると、一覧ページに紐づく。
 * 表記がずれると単なる自由タグ扱いになり、一覧に出てこないので注意。
 */
export type AnxietyTag = {
  /** URL に使う英字スラッグ。`/blog/tag/<slug>` */
  slug: string;
  /** microCMS の tags に入れる文字列。完全一致で判定する */
  label: string;
  /** 一覧ページの見出し下に出す説明 */
  description: string;
};

export const ANXIETY_TAGS: AnxietyTag[] = [
  {
    slug: "money",
    label: "お金の不安",
    description:
      "旅行は高い、予算が読めない。費用の見当をつけるための記事を集めています。",
  },
  {
    slug: "paperwork",
    label: "手続きの不安",
    description:
      "何を準備すればいいか分からない。パスポート・ビザ・保険・持ち物の記事を集めています。",
  },
  {
    slug: "onsite",
    label: "現地の不安",
    description:
      "言葉・移動・治安が心配。着いた日から困らないための記事を集めています。",
  },
  {
    slug: "planning",
    label: "段取りの不安",
    description:
      "日程が組めない、詰め込みすぎてしまう。旅程の立て方の記事を集めています。",
  },
];

const BY_SLUG = new Map(ANXIETY_TAGS.map((tag) => [tag.slug, tag]));
const BY_LABEL = new Map(ANXIETY_TAGS.map((tag) => [tag.label, tag]));

export function findAnxietyTagBySlug(slug: string): AnxietyTag | null {
  return BY_SLUG.get(slug) ?? null;
}

export function findAnxietyTagByLabel(label: string): AnxietyTag | null {
  return BY_LABEL.get(label.trim()) ?? null;
}

/** 記事のタグのうち、不安タグとして定義されているものだけを返す */
export function anxietyTagsOf(tags: string[]): AnxietyTag[] {
  return tags
    .map((tag) => findAnxietyTagByLabel(tag))
    .filter((tag): tag is AnxietyTag => tag !== null);
}

/** 記事のタグのうち、不安タグ以外（自由タグ）を返す */
export function freeTagsOf(tags: string[]): string[] {
  return tags.filter((tag) => findAnxietyTagByLabel(tag) === null);
}
