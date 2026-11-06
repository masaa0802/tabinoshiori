import Link from "next/link";
import type { AnxietyTag } from "@/lib/microcms/tags";

/**
 * ブログトップの「何が不安？」から探すタイル。不安タグ1つにつき1枚。
 *
 * 旅のノートの判子のように、丸枠の中に一文字を置く。色はタグごとに固定する。
 * どの色も生成りの紙の上でコントラスト比 4.5:1 以上になる濃さにしてある。
 *
 * **Tailwind のクラス名は動的に組み立てないこと。** 完成形のクラス文字列を
 * slug ごとに持たせている（CoverPlaceholder と同じ理由）。
 */
type Tone = {
  /** 判子の一文字 */
  mark: string;
  seal: string;
};

const TONES: Record<string, Tone> = {
  money: { mark: "金", seal: "border-shu text-shu" },
  paperwork: { mark: "券", seal: "border-ai text-ai" },
  onsite: { mark: "地", seal: "border-[#7a5210] text-[#7a5210]" },
  planning: { mark: "程", seal: "border-[#46498a] text-[#46498a]" },
};

/** tags.ts に不安タグを足したのに色を決め忘れても、表示は崩さない */
const FALLBACK_TONE: Tone = { mark: "旅", seal: "border-ink-soft text-ink-soft" };

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
              className="group flex h-full flex-col rounded-md border border-rule bg-paper-card p-4 transition-colors hover:border-ink-muted sm:p-5"
            >
              <span
                aria-hidden="true"
                className={`flex h-12 w-12 -rotate-6 items-center justify-center rounded-full border-2 font-mincho text-xl font-extrabold transition-transform group-hover:rotate-0 ${tone.seal}`}
              >
                {tone.mark}
              </span>
              <span className="mt-3 font-mincho text-lg font-extrabold text-ink">{tag.shortLabel}</span>
              <span className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">{tag.lead}</span>
              <span className="mt-3 text-xs font-medium text-ink-muted">
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
