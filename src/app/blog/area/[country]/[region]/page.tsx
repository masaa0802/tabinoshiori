import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/blog/ArticleCard";
import AreaBreadcrumbs from "@/components/blog/area/AreaBreadcrumbs";
import MapCanvas from "@/components/blog/area/MapCanvas";
import { MapPins } from "@/components/blog/area/MapMarkers";
import PlaceHero from "@/components/blog/area/PlaceHero";
import { getAllPosts } from "@/lib/microcms/queries";
import {
  blogJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdScript,
} from "@/lib/microcms/jsonLd";
import { buildCountryEntries } from "@/lib/areas";
import { boundsOf, buildWorldMap } from "@/lib/areas/worldMap";
import { CONTENT_RIGHT, INTRO_RIGHT, NARROW_WIDTH, WIDE_WIDTH } from "@/lib/areas/frame";
import type { Bounds, Region } from "@/data/areas";
import { BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ country: string; region: string }>;
};

async function findEntries(countrySlug: string, regionSlug: string) {
  const posts = await getAllPosts();
  const country = buildCountryEntries(posts).find((entry) => entry.country.slug === countrySlug);
  const region = country?.regions.find((item) => item.region.slug === regionSlug);
  if (!country || !region || region.posts.length === 0) return undefined;
  return { country, region };
}

/** 地域のまわりをどこまで映すか。国の大きさに合わせて、近くの地域も入る程度に寄る */
function regionBounds(region: Region, countryBounds: Bounds): Bounds {
  const [[west, south], [east, north]] = countryBounds;
  const half = Math.min(Math.max(Math.max(east - west, north - south) * 0.18, 2.5), 5);
  const [lon, lat] = region.lonLat;
  return [
    [lon - half, lat - half * 0.75],
    [lon + half, lat + half * 0.75],
  ];
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return buildCountryEntries(posts).flatMap((entry) =>
    entry.regions
      .filter((item) => item.posts.length > 0)
      .map((item) => ({ country: entry.country.slug, region: item.region.slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, region } = await params;
  const found = await findEntries(country, region);
  if (!found) return { title: "地域が見つかりません" };

  const { name } = found.region.region;
  const description = `${found.country.country.name}・${name}の旅行記事をまとめています。${found.region.region.lead}`;
  const path = `/blog/area/${country}/${region}`;
  return {
    title: `${name}の旅行記事`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${name}の旅行記事 | ${BLOG_NAME}`, description, url: path, type: "website" },
  };
}

export default async function RegionPage({ params }: PageProps) {
  const { country, region } = await params;
  const found = await findEntries(country, region);
  if (!found) notFound();

  const { country: countryEntry, region: regionEntry } = found;
  const current = regionEntry.region;
  const countryPath = `/blog/area/${countryEntry.country.slug}`;
  const path = `${countryPath}/${current.slug}`;
  const siblings = countryEntry.regions.filter((item) => item.posts.length > 0);
  const fit = regionBounds(current, boundsOf(countryEntry.country));
  const highlight = [countryEntry.country.isoNumeric];

  const wideHeight = 560;
  const wideMap = buildWorldMap({
    width: WIDE_WIDTH,
    height: wideHeight,
    focus: [INTRO_RIGHT + 60, 50, CONTENT_RIGHT - 30, wideHeight - 60],
    fit,
    highlight,
  });
  const narrowHeight = 260;
  const narrowMap = buildWorldMap({
    width: NARROW_WIDTH,
    height: narrowHeight,
    focus: [30, 24, NARROW_WIDTH - 30, narrowHeight - 24],
    fit,
    highlight,
  });

  const pinsOf = (project: (lonLat: [number, number]) => [number, number]) =>
    countryEntry.regions.map(({ region: item, posts }) => ({
      key: item.slug,
      label: item.name,
      point: project(item.lonLat),
      href: posts.length > 0 ? `${countryPath}/${item.slug}` : undefined,
      current: item.slug === current.slug,
      muted: posts.length === 0,
    }));

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: "地図から探す", path: "/blog/area" },
    { name: countryEntry.country.name, path: countryPath },
    { name: current.name, path },
  ];

  const chips = (
    <nav aria-label={`${countryEntry.country.name}の地域`} className="flex gap-2">
      {siblings.map(({ region: item, posts }) => {
        const isCurrent = item.slug === current.slug;
        return (
          <Link
            key={item.slug}
            href={`${countryPath}/${item.slug}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded border px-3.5 text-sm transition-colors ${
              isCurrent
                ? "border-shu bg-shu font-bold text-white"
                : "border-rule bg-paper-card text-ink-soft hover:border-shu hover:text-shu"
            }`}
          >
            {item.name}
            <span className={`text-xs ${isCurrent ? "text-white/85" : "text-ink-muted"}`}>{posts.length}</span>
          </Link>
        );
      })}
      <Link
        href={countryPath}
        className="inline-flex min-h-10 flex-shrink-0 items-center rounded border border-dashed border-rule px-3.5 text-sm text-ink-soft transition-colors hover:border-shu hover:text-shu"
      >
        {countryEntry.country.name}全体
      </Link>
    </nav>
  );

  const intro = (
    <>
      <AreaBreadcrumbs items={breadcrumbs} />
      <p className="mt-3 font-hand text-lg text-shu">{current.kicker}</p>
      <h1 className="mt-1 font-mincho text-[1.75rem] font-extrabold leading-[1.35] text-ink lg:text-[2.5rem]">
        {current.name}の記事
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft lg:text-[15px]">{current.lead}</p>
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd(regionEntry.posts, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(regionEntry.posts)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <PlaceHero
        height={wideHeight}
        intro={intro}
        wide={
          <MapCanvas layers={wideMap.layers} id="region-wide" className="absolute inset-0 h-full w-full">
            <MapPins pins={pinsOf(wideMap.project)} size="pc" />
          </MapCanvas>
        }
        wideExtra={
          <div className="mt-6">
            <p className="mb-2 text-[13px] text-ink-muted">{countryEntry.country.name}のほかの地域</p>
            <div className="[&>nav]:flex-wrap">{chips}</div>
          </div>
        }
        narrowExtra={
          <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">{chips}</div>
        }
        narrow={
          <MapCanvas
            layers={narrowMap.layers}
            id="region-narrow"
            blur={2}
            fit="meet"
            className="block h-auto w-full"
          >
            <MapPins pins={pinsOf(narrowMap.project)} size="sp" />
          </MapCanvas>
        }
      />

      <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <section className="mt-6 lg:mt-2">
          <h2 className="mb-8 flex items-center gap-4 font-mincho text-xl font-extrabold text-ink sm:text-2xl">
            {current.name}の記事 {regionEntry.posts.length}本
            <span aria-hidden="true" className="flex-1 border-t border-dashed border-ink-muted/50" />
          </h2>
          <div className="blog-card-grid grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {regionEntry.posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <p className="mt-12 text-sm text-ink-muted">
          <Link href={countryPath} className="text-shu underline underline-offset-2 hover:text-shu-dark">
            {countryEntry.country.name}のほかの記事を見る
          </Link>
        </p>
      </div>
    </>
  );
}
