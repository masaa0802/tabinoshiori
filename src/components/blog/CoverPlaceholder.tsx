/**
 * アイキャッチ画像が未設定のときに出す代替表示。
 *
 * 全記事で同じ色にすると、一覧に並んだとき「画像の読み込みに失敗している」ように
 * 見えてしまう。カテゴリごとに色を変えて、意図したデザインに見えるようにしている。
 *
 * **Tailwind のクラス名は動的に組み立てないこと。** ビルド時に使われている
 * クラスを走査する仕組みのため、文字列連結で作るとスタイルが消える。
 * ここでは完成形のクラス文字列を配列に持ち、添字で選んでいる。
 */
type Palette = {
  gradient: string;
  label: string;
  shape: string;
};

const PALETTES: Palette[] = [
  {
    gradient: "from-sky-100 via-cyan-50 to-sky-200",
    label: "text-sky-900/60",
    shape: "bg-sky-200/50",
  },
  {
    gradient: "from-amber-100 via-orange-50 to-amber-200",
    label: "text-amber-900/60",
    shape: "bg-amber-200/50",
  },
  {
    gradient: "from-emerald-100 via-teal-50 to-emerald-200",
    label: "text-emerald-900/60",
    shape: "bg-emerald-200/50",
  },
  {
    gradient: "from-violet-100 via-purple-50 to-violet-200",
    label: "text-violet-900/60",
    shape: "bg-violet-200/50",
  },
  {
    gradient: "from-rose-100 via-pink-50 to-rose-200",
    label: "text-rose-900/60",
    shape: "bg-rose-200/50",
  },
];

/** 既存カテゴリの色は固定する。順番や色が勝手に入れ替わらないように */
const PALETTE_BY_SLUG: Record<string, number> = {
  "destination-guide": 0,
  preparation: 1,
  "model-course": 2,
  souvenir: 4,
};

/**
 * 未知のカテゴリでも毎回同じ色になるよう、slug から決める。
 * カテゴリが増えてもコード変更なしで色が割り当たる。
 */
function paletteFor(slug: string): Palette {
  const fixed = PALETTE_BY_SLUG[slug];
  if (fixed !== undefined) return PALETTES[fixed];

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % PALETTES.length;
  }
  return PALETTES[hash];
}

type Props = {
  /** 色を決めるのに使う。カテゴリごとに固定の色になる */
  categorySlug: string;
  /** 表示するラベル。thumb では出さない */
  categoryName: string;
  /**
   * `thumb` は関連記事のモバイル表示（64x64）で使う。
   * この大きさでは文字が潰れて読めないため、背景だけにする。
   */
  variant?: "hero" | "card" | "thumb";
};

export default function CoverPlaceholder({
  categorySlug,
  categoryName,
  variant = "card",
}: Props) {
  const palette = paletteFor(categorySlug);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${palette.gradient}`}
    >
      {/* 奥行きを出すための装飾。情報は持たせない */}
      <div
        className={`absolute -right-8 -top-10 h-32 w-32 rounded-full ${palette.shape}`}
      />
      <div
        className={`absolute -bottom-12 -left-6 h-28 w-28 rounded-full ${palette.shape}`}
      />

      {variant !== "thumb" && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span
            className={`text-center font-semibold tracking-wide ${palette.label} ${
              variant === "hero" ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
            }`}
          >
            {categoryName}
          </span>
        </div>
      )}
    </div>
  );
}
