/**
 * 「何が不安？から探す」タイルのアイコン。不安タグごとに専用の線画を持つ。
 *
 * 絵文字は端末ごとに見た目が変わり、どのサイトでも同じ絵になるため、
 * たびのまえに用に描いたものを使う。
 *
 * - 線は `currentColor`。色は呼び出し側（AnxietyTiles の TONES）で決める
 * - 面は同じ色を薄く敷いた2トーン。線だけより、小さくても形が読み取りやすい
 * - 24×24 の枠、線幅 1.75、角は丸める。足すときもこの約束にそろえること
 */
type AnxietyIconProps = {
  slug: string;
  className?: string;
};

/** 面の塗り。線と同じ色を薄く敷く */
const TINT = { fill: "currentColor", fillOpacity: 0.14 } as const;

function Wallet() {
  // お金: 財布。手前の留め具に硬貨
  return (
    <>
      <path d="M6 6.75 15.6 3.9a1.5 1.5 0 0 1 1.9 1.44v1.41" />
      <rect x="3" y="6.75" width="18" height="13" rx="2.5" {...TINT} />
      <rect x="14.25" y="10.75" width="6.75" height="5" rx="2" fill="white" />
      <circle cx="17" cy="13.25" r="0.9" fill="currentColor" stroke="none" />
    </>
  );
}

function Passport() {
  // 手続き: パスポート。表紙の地球と、下の記入欄
  return (
    <>
      <rect x="5" y="2.75" width="14" height="18.5" rx="2" {...TINT} />
      <circle cx="12" cy="10" r="4" fill="white" />
      <path d="M8 10h8M12 6c-2 1.5-2 6.5 0 8M12 6c2 1.5 2 6.5 0 8" strokeWidth={1.25} />
      <path d="M9.25 17.5h5.5" />
    </>
  );
}

function Compass() {
  // 現地: 方位磁針。着いた先で向きが分かる
  return (
    <>
      <circle cx="12" cy="12" r="9" {...TINT} />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" fill="white" />
      <path d="M12 3v1.75M12 19.25V21M3 12h1.75M19.25 12H21" />
    </>
  );
}

function Route() {
  // 段取り: 出発点からゴールの旗まで、点線でつないだ道のり
  return (
    <>
      <circle cx="5.5" cy="18" r="2.25" {...TINT} />
      <path d="M9.25 16.5c2.6-1.4 1.6-4.25 4.5-4.25 2.25 0 2.75-1 3.5-2.25" strokeDasharray="0.01 3" />
      <path d="M18.75 10.25V3" />
      <path d="M18.75 3.25h3.5l-1.1 1.75 1.1 1.75h-3.5" {...TINT} />
    </>
  );
}

function Fallback() {
  // tags.ts に不安タグを足して、ここに絵を足し忘れたとき用
  return <circle cx="12" cy="12" r="8" {...TINT} />;
}

const ICONS: Record<string, () => React.ReactElement> = {
  money: Wallet,
  paperwork: Passport,
  onsite: Compass,
  planning: Route,
};

export default function AnxietyIcon({ slug, className }: AnxietyIconProps) {
  const Icon = ICONS[slug] ?? Fallback;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <Icon />
    </svg>
  );
}
