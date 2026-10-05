import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import ArticleBody from "@/components/blog/ArticleBody";
import ArticleCard from "@/components/blog/ArticleCard";
import CoverPlaceholder from "@/components/blog/CoverPlaceholder";
import CtaLink from "@/components/blog/CtaLink";
import ReadTracker from "@/components/blog/ReadTracker";
import PriceDisclosure from "@/components/blog/PriceDisclosure";
import SpotCard from "@/components/blog/SpotCard";
import { anxietyTagsOf, freeTagsOf } from "@/lib/microcms/tags";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/microcms/queries";
import {
  estimateReadingMinutes,
  formatDate,
  optimizedImageUrl,
  toDateAttribute,
} from "@/lib/microcms/format";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/microcms/jsonLd";
import { BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
  /** `draftKey` は microCMS の画面プレビューから `/api/preview` 経由で渡る */
  searchParams: Promise<{ draftKey?: string }>;
};

/**
 * プレビューとして開かれているかを判定し、使う draftKey を返す。
 *
 * Draft Mode の Cookie と draftKey の両方が揃ったときだけ下書きを取りにいく。
 * クエリだけで下書きが見えると、キーが漏れたときに誰でも開けてしまう。
 */
async function resolveDraftKey(
  searchParams: PageProps["searchParams"]
): Promise<string | undefined> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return undefined;
  const { draftKey } = await searchParams;
  return draftKey || undefined;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const draftKey = await resolveDraftKey(searchParams);
  const post = await getPostBySlug(slug, draftKey);

  if (!post) {
    return { title: "記事が見つかりません" };
  }

  // プレビューは検索結果に出さない。下書きのURLが拾われる経路を作らないため
  if (draftKey) {
    return {
      title: `[プレビュー] ${post.seoTitle || post.title}`,
      robots: { index: false, follow: false },
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const image = post.ogImage?.url ?? post.coverImage?.url;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function BlogArticlePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const draftKey = await resolveDraftKey(searchParams);
  const post = await getPostBySlug(slug, draftKey);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post);
  const readingMinutes = estimateReadingMinutes(post.body);
  const anxietyTags = anxietyTagsOf(post.tags);
  const freeTags = freeTagsOf(post.tags);

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: post.category.name, path: `/blog/category/${post.category.slug}` },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* パンくずリスト */}
        <nav aria-label="パンくずリスト" className="mb-6 text-xs text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/blog" className="hover:text-gray-900">
                {BLOG_NAME}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="hover:text-gray-900"
              >
                {post.category.name}
              </Link>
            </li>
          </ol>
        </nav>

        <header>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {post.category.name}
          </span>

          <h1 className="mt-4 text-2xl font-bold leading-snug text-gray-900 sm:text-4xl">
            {post.title}
          </h1>

          {anxietyTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {anxietyTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <time dateTime={toDateAttribute(post.publishedAt)}>
              {formatDate(post.publishedAt)}公開
            </time>
            {post.updatedAt !== post.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={toDateAttribute(post.updatedAt)}>
                  {formatDate(post.updatedAt)}更新
                </time>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>約{readingMinutes}分で読めます</span>
          </div>
        </header>

        {draftKey && (
          <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            <strong>下書きのプレビュー</strong>です。このページは公開されておらず、
            検索結果にも出ません。公開するには microCMS で公開してください。
          </p>
        )}

        {/* 画像が未設定でも枠は出す。消すとタイトルの直後に本文が始まって間が抜ける */}
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
          {post.coverImage ? (
            <Image
              src={optimizedImageUrl(post.coverImage.url, 1200)}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          ) : (
            <CoverPlaceholder
              categorySlug={post.category.slug}
              categoryName={post.category.name}
              variant="hero"
            />
          )}
        </div>

        {post.excerpt && (
          <p className="mt-8 rounded-xl bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
            {post.excerpt}
          </p>
        )}

        {/* 料金を含む記事の注釈。調査時点が古いと警告色に変わる */}
        <PriceDisclosure
          checkedAt={post.priceCheckedAt}
          sources={post.priceSources}
        />

        <div className="mt-4">
          <ArticleBody body={post.body} />
        </div>

        {/* 記事内で紹介したスポット */}
        {post.spots.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              この記事で紹介したスポット
            </h2>
            <div className="space-y-3">
              {post.spots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </section>
        )}

        {/* タグ。不安タグは一覧ページへのリンク、それ以外は表示のみ */}
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {anxietyTags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}`}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
              >
                #{tag.label}
              </Link>
            ))}
            {freeTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ここまで到達したら読了とみなす。本文の直後に置くこと。
            CTAより後ろに置くと、CTAを見た人を読了に数え損ねる */}
        <ReadTracker
          slug={post.slug}
          category={post.category.slug}
          readingMinutes={readingMinutes}
        />

        {/* 読了後のCTA。製品を知らない読者にも通じる言い回しにすること */}
        <section className="mt-14 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 sm:p-8">
          <h2 className="text-xl font-bold leading-snug text-gray-900">
            この内容をもとに、旅程を組み立てる
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            行き先と日程を入れると、訪問先・持ち物・予約情報をひとつのページにまとめられます。
            登録は不要で、URLを送れば同行者もそのまま見られます。
          </p>
          <CtaLink
            position="article_footer"
            slug={post.slug}
            category={post.category.slug}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
          >
            無料で旅程を作ってみる
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </CtaLink>
        </section>

        {/* 関連記事 */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-sm font-bold tracking-wide text-gray-400">
              あわせて読みたい
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.map((item) => (
                <ArticleCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
