import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/blog/ArticleCard";
import AreaBreadcrumbs from "@/components/blog/area/AreaBreadcrumbs";
import MapCanvas from "@/components/blog/area/MapCanvas";
import { MapPins } from "@/components/blog/area/MapMarkers";
import PlaceHero from "@/components/blog/area/PlaceHero";
import RegionList from "@/components/blog/area/RegionList";
import { getAllPosts } from "@/lib/microcms/queries";
import {
  blogJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdScript,
} from "@/lib/microcms/jsonLd";
import { buildCountryEntries, type CountryEntry } from "@/lib/areas";
import { buildWorldMap } from "@/lib/areas/worldMap";
import { CONTENT_RIGHT, INTRO_RIGHT, NARROW_WIDTH, WIDE_WIDTH } from "@/lib/areas/frame";
import { BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ country: string }>;
};

async function findEntry(slug: string): Promise<CountryEntry | undefined> {
  const posts = await getAllPosts();
  return buildCountryEntries(posts).find((entry) => entry.country.slug === slug);
}

/** 記事のある地域を先に、残りはマスタの順。番号は地図のピンと一覧で共通 */
function orderedRegions(entry: CountryEntry) {
  return [...entry.regions].sort(
    (a, b) => Number(b.posts.length > 0) - Number(a.posts.length > 0)
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return buildCountryEntries(posts).map((entry) => ({ country: entry.country.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const entry = await findEntry(country);
  if (!entry) return { title: "国が見つかりません" };

  const { name } = entry.country;
  const regionNames = entry.regions
    .filter((item) => item.posts.length > 0)
    .map((item) => item.region.name);
  const description = `${name}旅行の記事を地域ごとにまとめています。${
    regionNames.length > 0 ? `${regionNames.join("・")}の費用や回り方、` : "費用や"
  }入国手続きまで、出発前の「わからない」を解消します。`;
  const path = `/blog/area/${entry.country.slug}`;

  return {
    title: `${name}の旅行記事`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${name}の旅行記事 | ${BLOG_NAME}`, description, url: path, type: "website" },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params;
  const entry = await findEntry(country);
  if (!entry) notFound();

  const regions = orderedRegions(entry);
  const path = `/blog/area/${entry.country.slug}`;
  const highlight = [entry.country.isoNumeric];

  const wideHeight = Math.max(700, 400 + regions.length * 70);
  const wideFocus: [number, number, number, number] = [INTRO_RIGHT + 30, 60, CONTENT_RIGHT - 30, wideHeight - 50];
  const wideMap = buildWorldMap({
    width: WIDE_WIDTH,
    height: wideHeight,
    focus: wideFocus,
    fit: entry.country,
    highlight,
    minSpan: 6,
  });

  const narrowHeight = 430;
  const narrowMap = buildWorldMap({
    width: NARROW_WIDTH,
    height: narrowHeight,
    focus: [36, 34, NARROW_WIDTH - 36, narrowHeight - 34],
    fit: entry.country,
    highlight,
    minSpan: 6,
  });

  const pinsOf = (project: (lonLat: [number, number]) => [number, number]) =>
    regions.map(({ region, posts }, index) => ({
      key: region.slug,
      label: region.name,
      number: index + 1,
      point: project(region.lonLat),
      href: posts.length > 0 ? `${path}/${region.slug}` : undefined,
      muted: posts.length === 0,
    }));

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: "地図から探す", path: "/blog/area" },
    { name: entry.country.name, path },
  ];

  const intro = (
    <>
      <AreaBreadcrumbs items={breadcrumbs} />
      <p className="mt-3 font-hand text-lg text-shu">{entry.country.kicker}</p>
      <h1 className="mt-1 font-mincho text-[1.75rem] font-extrabold leading-[1.35] text-ink lg:text-[2.5rem]">
        {entry.country.name}の記事
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft lg:text-[15px]">
        {regions.length > 0 ? entry.country.lead : `${entry.country.name}の記事をまとめています。`}
      </p>
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd(entry.posts, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(entry.posts)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <PlaceHero
        height={wideHeight}
        intro={intro}
        wide={
          <MapCanvas layers={wideMap.layers} id="country-wide" className="absolute inset-0 h-full w-full">
            <MapPins pins={pinsOf(wideMap.project)} size="pc" />
          </MapCanvas>
        }
        wideExtra={
          regions.length > 0 && (
            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-muted">地域から選ぶ</h2>
              <RegionList countrySlug={entry.country.slug} regions={regions} compact />
            </div>
          )
        }
        narrow={
          <MapCanvas
            layers={narrowMap.layers}
            id="country-narrow"
            blur={2.2}
            fit="meet"
            className="block h-auto w-full"
          >
            <MapPins pins={pinsOf(narrowMap.project)} size="sp" />
          </MapCanvas>
        }
      />

      <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        {regions.length > 0 && (
          <section className="mx-auto max-w-xl pt-2 lg:hidden">
            <h2 className="mb-4 flex items-center gap-4 font-mincho text-xl font-extrabold text-ink">
              地域から選ぶ
              <span aria-hidden="true" className="flex-1 border-t border-dashed border-ink-muted/50" />
            </h2>
            <RegionList countrySlug={entry.country.slug} regions={regions} />
          </section>
        )}

        {entry.countryWidePosts.length > 0 && (
          <section className="mt-12 lg:mt-6">
            <h2 className="mb-8 flex items-center gap-4 font-mincho text-xl font-extrabold text-ink sm:text-2xl">
              {entry.country.name}全体の記事
              <span aria-hidden="true" className="flex-1 border-t border-dashed border-ink-muted/50" />
            </h2>
            <div className="blog-card-grid grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {entry.countryWidePosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 text-sm text-ink-muted">
          <Link href="/blog/area" className="text-shu underline underline-offset-2 hover:text-shu-dark">
            地図にもどって、ほかの国を探す
          </Link>
        </p>
      </div>
    </>
  );
}
