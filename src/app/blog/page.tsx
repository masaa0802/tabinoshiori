import Link from "next/link";
import type { Metadata } from "next";
import ArticleCard from "@/components/blog/ArticleCard";
import { getAllCategories, getAllPosts, getFeaturedPost } from "@/lib/microcms/queries";
import { blogJsonLd, itemListJsonLd, jsonLdScript } from "@/lib/microcms/jsonLd";
import { ANXIETY_TAGS } from "@/lib/microcms/tags";
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
  const [posts, categories, featured] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getFeaturedPost(),
  ]);

  const rest = featured ? posts.filter((post) => post.slug !== featured.slug) : posts;

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
        {/* イントロ */}
        <section>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            旅行の「わからない」を、
            <br className="sm:hidden" />
            ひとつずつ解消する
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            {BLOG_DESCRIPTION}
          </p>
        </section>

        {/* 不安の種類で探す。読者が自分の悩みから入れるようにするための軸 */}
        <nav className="mt-8" aria-label="不安の種類">
          <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-400">
            気になっていることから探す
          </h2>
          <div className="flex flex-wrap gap-2">
            {ANXIETY_TAGS.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}`}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* カテゴリ（情報の種類）。不安タグと直交する軸 */}
        {categories.length > 0 && (
          <nav className="mt-6" aria-label="カテゴリ">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-400">
              記事の種類から探す
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog/category/${category.slug}`}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* 注目記事 */}
        {featured && (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-bold tracking-wide text-gray-400">
              注目の記事
            </h2>
            <ArticleCard post={featured} featured />
          </section>
        )}

        {/* 新着記事 */}
        {rest.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-sm font-bold tracking-wide text-gray-400">
              新着記事
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <p className="mt-16 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            記事はまだありません。
          </p>
        )}

        {/* CTA。読者の便益で書く（製品を知らない読者に通じる言い回しにすること） */}
        <section className="mt-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
            調べた内容を、旅程の形にまとめる
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-emerald-50">
            行き先と日程を入れるだけで、持ち物や予約情報までひとつのページに整理できます。
            登録なしで使えて、URLを送れば同行者にもそのまま共有できます。
          </p>
          <Link
            href="/group/new"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-emerald-700 shadow-lg transition-transform hover:scale-105"
          >
            無料で旅程を作ってみる
          </Link>
        </section>
      </div>
    </>
  );
}
