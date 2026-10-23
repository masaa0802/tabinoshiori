import Link from "next/link";
import type { AnxietyTag } from "@/lib/microcms/tags";

/**
 * ブログトップの「何が不安？」から探すタイル。不安タグ1つにつき1枚。
 *
 * 色はタグごとに固定する。CoverPlaceholder のカテゴリ色と同じ系統（amber / sky /
 * rose / violet）にそろえ、ブログ全体で使う色を増やさない。
 *
 * **Tailwind のクラス名は動的に組み立てないこと。** 完成形のクラス文字列を
 * slug ごとに持たせている（CoverPlaceholder と同じ理由）。
 */
type Tone = {
  tile: string;
  label: string;
};

const TONES: Record<string, Tone> = {
  money: {
    tile: "bg-amber-50 border-amber-100 hover:border-amber-300",
    label: "text-amber-900",
  },
  paperwork: {
    tile: "bg-sky-50 border-sky-100 hover:border-sky-300",
    label: "text-sky-900",
  },
  onsite: {
    tile: "bg-rose-50 border-rose-100 hover:border-rose-300",
    label: "text-rose-900",
  },
  planning: {
    tile: "bg-violet-50 border-violet-100 hover:border-violet-300",
    label: "text-violet-900",
  },
};

/** tags.ts に不安タグを足したのに色を決め忘れても、表示は崩さない */
const FALLBACK_TONE: Tone = {
  tile: "bg-gray-50 border-gray-100 hover:border-gray-300",
  label: "text-gray-900",
};

type AnxietyTilesProps = {
  tags: AnxietyTag[];
  /** slug ごとの記事数 */
  counts: Record<string, number>;
};

const AnxietyTiles: React.FC<AnxietyTilesProps> = ({ tags, counts }) => {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {tags.map((tag) => {
        const tone = TONES[tag.slug] ?? FALLBACK_TONE;
        const count = counts[tag.slug] ?? 0;
        return (
          <li key={tag.slug}>
            <Link
              href={`/blog/tag/${tag.slug}`}
              className={`flex h-full flex-col rounded-2xl border p-4 transition-colors sm:p-5 ${tone.tile}`}
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm"
              >
                {tag.emoji}
              </span>
              <span className={`mt-3 text-lg font-bold ${tone.label}`}>{tag.shortLabel}</span>
              <span className="mt-1 flex-1 text-xs leading-relaxed text-gray-600">{tag.lead}</span>
              <span className="mt-3 text-xs font-medium text-gray-500">
                {count > 0 ? `${count}本の記事 →` : "記事を準備中"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default AnxietyTiles;
