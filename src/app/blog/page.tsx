import CtaLink from "@/components/blog/CtaLink";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import AnxietyTiles from "@/components/blog/AnxietyTiles";
import ArticleCard from "@/components/blog/ArticleCard";
import SectionHeading from "@/components/blog/SectionHeading";
import { optimizedImageUrl } from "@/lib/microcms/format";
import { getAllCategories, getAllPosts, getPickupPosts } from "@/lib/microcms/queries";
import { blogJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/microcms/jsonLd";
import { ANXIETY_TAGS, anxietyTagsOf } from "@/lib/microcms/tags";
import { BLOG_DESCRIPTION, BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${BLOG_NAME} | 旅行の準備と現地の歩き方`,
  // 記事の内容だけで完結させる。サービス説明はここに書かない
  description:
    "はじめての旅行でつまずきやすいポイントを解説します。持ち物の決め方、航空券が安くなる時期、空港から市内への移動、日数別の回り方まで。",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${BLOG_NAME} | 旅行の準備と現地の歩き方`,
    description:
      "はじめての旅行でつまずきやすいポイントを解説します。持ち物の決め方、航空券が安くなる時期、空港から市内への移動、日数別の回り方まで。",
    url: "/blog",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function BlogTopPage() {
  const [posts, categories, pickups] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getPickupPosts(),
  ]);

  // 帯に出した記事は新着一覧から外す。同じ記事が上下に2回並ばないように
  const pickupSlugs = new Set(pickups.map((post) => post.slug));
  const rest = posts.filter((post) => !pickupSlugs.has(post.slug));
  // 冒頭に「貼った写真」として出す最新記事（表紙画像があるもの）
  const latest = posts.find((post) => post.coverImage);

  const anxietyCounts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of anxietyTagsOf(post.tags)) {
      anxietyCounts[tag.slug] = (anxietyCounts[tag.slug] ?? 0) + 1;
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd(posts)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(posts)) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* イントロ。左にコピー、右に最新記事の表紙を「貼った写真」として置く */}
        <section className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <div>
            <p className="font-hand text-lg text-shu sm:text-xl">次の旅、どこへ行こう。</p>
            <h1 className="mt-3 font-mincho text-[2rem] font-extrabold leading-[1.4] tracking-[0.02em] text-ink sm:text-[2.5rem] sm:leading-[1.4] lg:text-[2.75rem]">
              出発までの
              <br />
              「わからない」を、
              <br />
              旅の楽しみに変える。
            </h1>
            <p className="mt-6 max-w-xl text-base leading-[1.9] text-ink-soft">
              {BLOG_DESCRIPTION}
            </p>
          </div>

          {latest?.coverImage && (
            <Link href={`/blog/${latest.slug}`} className="group relative mx-auto block w-full max-w-md pb-6 md:pb-10">
              <figure className="relative -rotate-2 bg-paper-card p-3 pb-4 shadow-[0_2px_0_var(--color-rule),0_16px_32px_rgba(60,40,20,0.14)] transition-[rotate] duration-300 group-hover:rotate-0">
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-1/3 z-10 h-6 w-24 -rotate-6 bg-[rgba(194,170,120,0.55)]"
                />
                <div className="relative aspect-[16/9] overflow-hidden bg-paper-deep">
                  <Image
                    src={optimizedImageUrl(latest.coverImage.url, 900)}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 px-1 font-hand text-[15px] leading-relaxed text-ink-soft">
                  最新の旅メモ：{latest.title}
                </figcaption>
              </figure>
              {/* 判子。飾りなので読み上げない */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 right-0 flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full border-[2.5px] border-shu text-shu sm:h-28 sm:w-28"
              >
                <span className="text-[9px] tracking-[0.2em]">BEFORE</span>
                <span className="font-mincho text-base font-extrabold sm:text-lg">旅のまえ</span>
                <span className="text-[9px] tracking-[0.2em]">THE TRIP</span>
              </span>
            </Link>
          )}
        </section>

        {/* 不安の種類で探す。読者が自分の悩みから入れるようにするための軸。
            ブログトップでいちばん目立つ入口にしたいので、タグではなくタイルで出す */}
        <nav className="mt-14" aria-label="不安の種類">
          <SectionHeading>何が不安？から探す</SectionHeading>
          <AnxietyTiles tags={ANXIETY_TAGS} counts={anxietyCounts} />
        </nav>

        {/* カテゴリ（情報の種類）。不安タグと直交する軸 */}
        {categories.length > 0 && (
          <nav className="mt-8" aria-label="カテゴリ">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-muted">
              記事の種類から探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog/category/${category.slug}`}
                  className="rounded border border-rule bg-paper-card px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-shu hover:text-shu"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* はじめての方へ。microCMS で「注目記事」をオンにした記事を最大3本。
            スマホでは画面の端まで広げて、帯として目立たせる */}
        {pickups.length > 0 && (
          <section
            aria-labelledby="pickup-heading"
            className="-mx-4 mt-16 border-y border-rule bg-paper-deep px-4 py-10 sm:mx-0 sm:rounded-md sm:border sm:px-8 sm:py-12"
          >
            <p className="font-hand text-lg text-shu">はじめての方へ</p>
            <h2 id="pickup-heading" className="mt-1 font-mincho text-2xl font-extrabold text-ink sm:text-3xl">
              まずはこの記事から
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              旅行の準備で最初につまずきやすいところを、先に押さえておける記事です。
            </p>
            <div className="blog-card-grid mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {pickups.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* 新着記事 */}
        {rest.length > 0 && (
          <section className="mt-16">
            <SectionHeading>新着記事</SectionHeading>
            <div className="blog-card-grid mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <p className="mt-16 rounded-md border border-dashed border-rule p-10 text-center text-ink-muted">
            記事はまだありません。
          </p>
        )}

        {/* CTA。読者の便益で書く（製品を知らない読者に通じる言い回しにすること） */}
        <section className="relative mt-20 grid items-center gap-8 rounded-md border border-rule bg-paper-card px-6 py-12 shadow-[0_1px_0_var(--color-rule)] sm:px-12 md:grid-cols-[1fr_auto]">
          <span
            aria-hidden="true"
            className="absolute -top-3 left-10 h-6 w-24 -rotate-3 bg-[rgba(194,170,120,0.55)]"
          />
          <div>
            <p className="font-hand text-lg text-shu">調べ終わったら</p>
            <h2 className="mt-1 font-mincho text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
              調べた内容を、旅程の形にまとめる
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
              行き先と日程を入れるだけで、持ち物や予約情報までひとつのページに整理できます。
              登録なしで使えて、URLを送れば同行者にもそのまま共有できます。
            </p>
          </div>
          <CtaLink
            position="blog_top"
            className="inline-flex items-center justify-center gap-2 justify-self-start rounded bg-shu px-8 py-3.5 font-bold text-white transition-colors hover:bg-shu-dark md:justify-self-end"
          >
            無料で旅程を作ってみる
          </CtaLink>
        </section>
      </div>
    </>
  );
}
