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
import SouvenirGuide from "@/components/blog/SouvenirGuide";
import TableOfContents from "@/components/blog/TableOfContents";
import SpotCard from "@/components/blog/SpotCard";
import SectionHeading from "@/components/blog/SectionHeading";
import { anxietyTagsOf, freeTagsOf } from "@/lib/microcms/tags";
import {
  getAllAuthors,
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/microcms/queries";
import {
  estimateReadingMinutes,
  formatDate,
  optimizedImageUrl,
  toDateAttribute,
} from "@/lib/microcms/format";
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/microcms/jsonLd";
import { buildToc } from "@/lib/microcms/toc";
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

  const [related, authors] = await Promise.all([getRelatedPosts(post), getAllAuthors()]);
  const readingMinutes = estimateReadingMinutes(post.body);
  const anxietyTags = anxietyTagsOf(post.tags);
  const freeTags = freeTagsOf(post.tags);
  // 見出しに id を付けた本文と、目次の項目を同時に作る
  const toc = buildToc(post.body);

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
        <nav aria-label="パンくずリスト" className="mb-6 text-xs text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/blog" className="hover:text-shu">
                {BLOG_NAME}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="hover:text-shu"
              >
                {post.category.name}
              </Link>
            </li>
          </ol>
        </nav>

        <header>
          <span className="inline-flex -rotate-2 items-center border-[1.5px] border-shu px-2.5 py-0.5 text-xs font-bold text-shu">
            {post.category.name}
          </span>

          <h1 className="mt-4 font-mincho text-[1.75rem] font-extrabold leading-[1.45] text-ink sm:text-[2.5rem]">
            {post.title}
          </h1>

          {anxietyTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {anxietyTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="rounded border border-rule bg-paper-card px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-shu hover:text-shu"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
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
        <div className="relative mt-10 aspect-[16/9] overflow-hidden bg-paper-deep outline outline-8 outline-paper-card shadow-[0_0_0_9px_var(--color-rule),0_18px_36px_rgba(60,40,20,0.12)] sm:outline-[10px]">
          {post.coverImage ? (
            <Image
              src={optimizedImageUrl(post.coverImage.url, 1200)}
              // 画像検索からの流入のため、空にせず記事タイトルを入れる
              alt={post.title}
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
          <div className="relative mt-10 bg-memo px-5 pb-5 pt-6 shadow-[0_1px_0_var(--color-rule)]">
            <span
              aria-hidden="true"
              className="absolute -top-2.5 left-6 h-5 w-20 -rotate-3 bg-[rgba(194,170,120,0.55)]"
            />
            <p className="text-sm leading-[1.9] text-ink-soft">{post.excerpt}</p>
          </div>
        )}

        {/* 料金を含む記事の注釈。調査時点が古いと警告色に変わる */}
        <PriceDisclosure
          checkedAt={post.priceCheckedAt}
          sources={post.priceSources}
        />

        <TableOfContents items={toc.items} />

        <div className="mt-4">
          <ArticleBody body={toc.body} authors={authors} />
        </div>

        {/* お土産ガイド。本文を導入にして、その直後に一覧を置く */}
        <SouvenirGuide souvenirs={post.souvenirs} />

        {/* 記事内で紹介したスポット */}
        {post.spots.length > 0 && (
          <section className="mt-14">
            <SectionHeading>この記事で紹介したスポット</SectionHeading>
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
                className="rounded border border-rule bg-paper-card px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-shu hover:text-shu"
              >
                #{tag.label}
              </Link>
            ))}
            {freeTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-paper-deep px-3 py-1 text-xs text-ink-soft"
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
        <section className="mt-14 rounded-md bg-ink p-6 text-paper sm:p-8">
          <p className="font-hand text-[15px] text-[#f0c9a8]">読み終わったら</p>
          <h2 className="mt-1 font-mincho text-xl font-extrabold leading-snug sm:text-2xl">
            この内容をもとに、旅程を組み立てる
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#e8e0d2]">
            行き先と日程を入れると、訪問先・持ち物・予約情報をひとつのページにまとめられます。
            登録は不要で、URLを送れば同行者もそのまま見られます。
          </p>
          <CtaLink
            position="article_footer"
            slug={post.slug}
            category={post.category.slug}
            className="mt-6 inline-flex items-center gap-2 rounded bg-shu px-7 py-3 font-bold text-white transition-colors hover:bg-shu-dark"
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
            <SectionHeading>あわせて読みたい</SectionHeading>
            <div className="blog-card-grid mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
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
