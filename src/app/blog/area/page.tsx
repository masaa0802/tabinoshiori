import Link from "next/link";
import type { Metadata } from "next";
import AreaExplorer, {
  type ExplorerGroup,
  type ExplorerPanel,
} from "@/components/blog/area/AreaExplorer";
import AreaBreadcrumbs from "@/components/blog/area/AreaBreadcrumbs";
import MapCanvas from "@/components/blog/area/MapCanvas";
import {
  MapPins,
  MapStickers,
  placeInColumn,
  placeNearby,
} from "@/components/blog/area/MapMarkers";
import { getAllPosts } from "@/lib/microcms/queries";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/microcms/jsonLd";
import {
  buildAreaGroupEntries,
  buildCountryEntries,
  countPosts,
  type AreaEntry,
  type CountryEntry,
} from "@/lib/areas";
import { anchorOf, buildWorldMap, type Rect } from "@/lib/areas/worldMap";
import {
  CONTENT_LEFT,
  CONTENT_RIGHT,
  INTRO_RIGHT,
  NARROW_WIDTH,
  WIDE_WIDTH,
} from "@/lib/areas/frame";
import { BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

const TITLE = "地図から旅先を探す";
const DESCRIPTION =
  "行きたい国を地図から選んで、街や地域ごとの記事を探せます。費用、入国手続き、回り方まで、旅先ごとにまとめています。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog/area" },
  openGraph: {
    title: `${TITLE} | ${BLOG_NAME}`,
    description: DESCRIPTION,
    url: "/blog/area",
    type: "website",
  },
};

const WIDE_HEIGHT = 760;
const NARROW_HEIGHT = 470;
/** これより国が多いエリアは、札を国のそばに置くと重なるので並べ方を変える */
const DENSE_WIDE = 5;
const DENSE_NARROW = 4;

function countryHref(entry: CountryEntry) {
  return `/blog/area/${entry.country.slug}`;
}

function regionCount(entry: CountryEntry) {
  return entry.regions.filter((item) => item.posts.length > 0).length;
}

function buildPanel(area: AreaEntry, highlight: string[]): ExplorerPanel {
  const countries = area.countries;

  // PC
  const denseWide = countries.length > DENSE_WIDE;
  const wideFocus: Rect = denseWide
    ? [INTRO_RIGHT, 80, CONTENT_LEFT + 800, WIDE_HEIGHT - 40]
    : [INTRO_RIGHT + 10, 70, CONTENT_RIGHT - 40, WIDE_HEIGHT - 40];
  const wideMap = buildWorldMap({
    width: WIDE_WIDTH,
    height: WIDE_HEIGHT,
    focus: wideFocus,
    fit: area.area.bounds,
    highlight,
  });
  const wideItems = countries.map((entry) => ({
    key: entry.country.slug,
    name: entry.country.name,
    count: entry.posts.length,
    href: countryHref(entry),
    anchor: wideMap.project(anchorOf(entry.country)),
  }));
  const wideStickers = denseWide
    ? placeInColumn(wideItems, CONTENT_LEFT + 850, 110, WIDE_HEIGHT - 70, "pc")
    : placeNearby(wideItems, wideFocus, [INTRO_RIGHT - 40, 24, CONTENT_RIGHT, WIDE_HEIGHT - 60], "pc");

  // スマホ
  const denseNarrow = countries.length > DENSE_NARROW;
  const narrowFocus: Rect = [22, 40, NARROW_WIDTH - 22, NARROW_HEIGHT - 30];
  const narrowMap = buildWorldMap({
    width: NARROW_WIDTH,
    height: NARROW_HEIGHT,
    focus: narrowFocus,
    fit: area.area.bounds,
    highlight,
  });
  const narrowItems = countries.map((entry) => ({
    key: entry.country.slug,
    name: entry.country.name,
    count: entry.posts.length,
    href: countryHref(entry),
    anchor: narrowMap.project(anchorOf(entry.country)),
  }));
  // 番号は地図の上から順に振る（一覧も同じ順に並べる）
  const numbered = [...narrowItems].sort(
    (a, b) => a.anchor[1] - b.anchor[1] || a.anchor[0] - b.anchor[0]
  );
  const numberOf = new Map(numbered.map((item, index) => [item.key, index + 1]));

  const listed = denseNarrow
    ? [...countries].sort(
        (a, b) => (numberOf.get(a.country.slug) ?? 0) - (numberOf.get(b.country.slug) ?? 0)
      )
    : countries;

  return {
    slug: area.area.slug,
    wide: (
      <MapCanvas layers={wideMap.layers} id={`wide-${area.area.slug}`} className="absolute inset-0 h-full w-full">
        <MapStickers stickers={wideStickers} size="pc" />
      </MapCanvas>
    ),
    narrow: (
      <MapCanvas
        layers={narrowMap.layers}
        id={`narrow-${area.area.slug}`}
        blur={2.2}
        fit="meet"
        className="block h-auto w-full"
      >
        {denseNarrow ? (
          <MapPins
            size="sp"
            showLabels={false}
            pins={numbered.map((item) => ({
              key: item.key,
              label: item.name,
              number: numberOf.get(item.key),
              point: item.anchor,
              href: item.href,
            }))}
          />
        ) : (
          <MapStickers
            size="sp"
            stickers={placeNearby(narrowItems, narrowFocus, [6, 8, NARROW_WIDTH - 6, NARROW_HEIGHT - 8], "sp")}
          />
        )}
      </MapCanvas>
    ),
    list: (
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-4 sm:px-6 lg:pt-4">
        <h2 className="mb-4 flex items-center gap-4 font-mincho text-xl font-extrabold text-ink sm:text-2xl">
          {area.area.name}の国
          <span aria-hidden="true" className="flex-1 border-t border-dashed border-ink-muted/50" />
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {listed.map((entry) => {
            const number = numberOf.get(entry.country.slug);
            const regions = entry.regions.filter((item) => item.posts.length > 0);
            return (
              <li key={entry.country.slug}>
                <Link
                  href={countryHref(entry)}
                  className="flex h-full items-start gap-2.5 rounded border border-rule bg-paper-card px-3 py-3 transition-colors hover:border-shu sm:px-4 sm:py-4"
                >
                  {denseNarrow && (
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-shu text-xs font-bold text-shu lg:hidden">
                      {number}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-mincho text-base font-extrabold text-ink sm:text-xl">
                      {entry.country.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted sm:text-[13px]">
                      {regionCount(entry) > 0 && `${regionCount(entry)}地域・`}
                      {entry.posts.length}記事
                    </span>
                    {regions.length > 0 && (
                      <span className="mt-1.5 hidden text-[13px] leading-relaxed text-ink-soft sm:block">
                        {regions.map((item) => item.region.name).join("・")}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="hidden text-shu sm:inline">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    ),
  };
}

export default async function AreaTopPage() {
  const posts = await getAllPosts();
  const countries = buildCountryEntries(posts);
  const groups = buildAreaGroupEntries(countries);
  const highlight = countries.map((entry) => entry.country.isoNumeric);

  const explorerGroups: ExplorerGroup[] = groups.map(({ group, areas }) => ({
    slug: group.slug,
    name: group.name,
    count: countPosts(areas),
    areas: areas.map((entry) => ({
      slug: entry.area.slug,
      name: entry.area.name,
      count: countPosts([entry]),
    })),
  }));

  const panels = groups
    .flatMap(({ areas }) => areas)
    .filter((area) => area.countries.length > 0)
    .map((area) => buildPanel(area, highlight));

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: "地図から探す", path: "/blog/area" },
  ];

  const intro = (
    <>
      <AreaBreadcrumbs items={breadcrumbs} />
      <p className="mt-3 font-hand text-lg text-shu">次の旅、どこへ行こう。</p>
      <h1 className="mt-1 font-mincho text-[1.75rem] font-extrabold leading-[1.35] text-ink lg:text-[2.5rem]">
        地図から
        <br />
        旅先を探す
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft lg:text-[15px]">
        エリアを選んで、行きたい国の札を押してください。
        <span className="hidden lg:inline">街や地域ごとに記事を絞り込めます。</span>
      </p>
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />
      {panels.length > 0 ? (
        <AreaExplorer intro={intro} groups={explorerGroups} panels={panels} />
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {intro}
          <p className="mt-10 rounded-md border border-dashed border-rule p-10 text-center text-ink-muted">
            国や地域に紐づいた記事はまだありません。
          </p>
        </div>
      )}
    </>
  );
}
