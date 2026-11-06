import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/blog/ArticleCard";
import { getPostsByAnxietyTag } from "@/lib/microcms/queries";
import { ANXIETY_TAGS, findAnxietyTagBySlug } from "@/lib/microcms/tags";
import {
  blogJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdScript,
} from "@/lib/microcms/jsonLd";
import { BLOG_NAME } from "@/lib/site";

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return ANXIETY_TAGS.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = findAnxietyTagBySlug(slug);

  if (!tag) {
    return { title: "タグが見つかりません" };
  }

  return {
    title: `${tag.label}を解消する記事`,
    description: tag.description,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
    openGraph: {
      title: `${tag.label}を解消する記事 | ${BLOG_NAME}`,
      description: tag.description,
      url: `/blog/tag/${tag.slug}`,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = findAnxietyTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const posts = await getPostsByAnxietyTag(tag.slug);
  const path = `/blog/tag/${tag.slug}`;

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: tag.label, path },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd(posts, path)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd(posts)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="パンくずリスト" className="mb-6 text-xs text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/blog" className="hover:text-shu">
                {BLOG_NAME}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">{tag.label}</li>
          </ol>
        </nav>

        <header>
          <h1 className="font-mincho text-3xl font-extrabold text-ink sm:text-4xl">
            {tag.label}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            {tag.description}
          </p>
          <p className="mt-2 text-sm text-ink-muted">{posts.length}件の記事</p>
        </header>

        {/* 不安タグの切り替え */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="不安の種類">
          {ANXIETY_TAGS.map((item) => {
            const isActive = item.slug === tag.slug;
            return (
              <Link
                key={item.slug}
                href={`/blog/tag/${item.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-paper-card text-ink-soft hover:border-shu hover:text-shu"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {posts.length > 0 ? (
          <div className="blog-card-grid mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-12 rounded-md border border-dashed border-rule p-10 text-center text-ink-muted">
            この不安に答える記事はまだありません。
          </p>
        )}

        <p className="mt-12 text-sm text-ink-muted">
          <Link href="/blog" className="text-shu underline underline-offset-2 hover:text-shu-dark">
            すべての記事を見る
          </Link>
        </p>
      </div>
    </>
  );
}
