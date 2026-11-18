type PlaceHeroProps = {
  /** PC の背景地図 */
  wide: React.ReactNode;
  /** スマホの地図 */
  narrow: React.ReactNode;
  /** 見出しまわり（PC・スマホ共通） */
  intro: React.ReactNode;
  /** PC で見出しの下に続けるもの（地域の一覧など） */
  wideExtra?: React.ReactNode;
  /** スマホで見出しと地図のあいだに置くもの（地域の切り替えなど） */
  narrowExtra?: React.ReactNode;
  /** PC の高さ（px）。背景地図の SVG の高さと合わせること */
  height: number;
};

/**
 * 国・地域ページの冒頭。PC は地図を背景いっぱいに敷いて見出しを左に重ね、
 * スマホは見出しの下に地図を置く。
 */
const PlaceHero: React.FC<PlaceHeroProps> = ({ wide, narrow, intro, wideExtra, narrowExtra, height }) => (
  <>
    <section className="relative hidden overflow-hidden lg:block" style={{ height }}>
      {wide}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,230,0.95)_0,rgba(244,239,230,0.82)_calc(50%-180px),rgba(244,239,230,0)_calc(50%-60px)),linear-gradient(0deg,var(--color-paper)_0,rgba(244,239,230,0)_80px)]"
      />
      <div className="pointer-events-none relative mx-auto h-full max-w-5xl px-6 pt-14">
        <div className="pointer-events-auto w-[400px]">
          {intro}
          {wideExtra}
        </div>
      </div>
    </section>

    <section className="lg:hidden">
      <div className="mx-auto max-w-xl px-4 pt-7">
        {intro}
        {narrowExtra}
      </div>
      <div className="relative mx-auto max-w-xl">
        {narrow}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-paper to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent"
        />
      </div>
    </section>
  </>
);

export default PlaceHero;
