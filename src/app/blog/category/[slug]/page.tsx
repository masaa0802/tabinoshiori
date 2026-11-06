import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/blog/ArticleCard";
import {
  getAllCategories,
  getCategoryBySlug,
  getPostsByCategory,
} from "@/lib/microcms/queries";
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
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "カテゴリが見つかりません" };
  }

  const description =
    category.description || `${category.name}に関する記事の一覧です。`;

  return {
    title: `${category.name}の記事一覧`,
    description,
    alternates: { canonical: `/blog/category/${category.slug}` },
    openGraph: {
      title: `${category.name}の記事一覧 | ${BLOG_NAME}`,
      description,
      url: `/blog/category/${category.slug}`,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getAllCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(category.slug);
  const path = `/blog/category/${category.slug}`;

  const breadcrumbs = [
    { name: BLOG_NAME, path: "/blog" },
    { name: category.name, path },
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
            <li className="text-ink">{category.name}</li>
          </ol>
        </nav>

        <header>
          <h1 className="font-mincho text-3xl font-extrabold text-ink sm:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
              {category.description}
            </p>
          )}
          <p className="mt-2 text-sm text-ink-muted">{posts.length}件の記事</p>
        </header>

        {/* カテゴリ切り替え */}
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="カテゴリ">
          <Link
            href="/blog"
            className="rounded border border-rule bg-paper-card px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-shu hover:text-shu"
          >
            すべて
          </Link>
          {categories.map((item) => {
            const isActive = item.slug === category.slug;
            return (
              <Link
                key={item.id}
                href={`/blog/category/${item.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-paper-card text-ink-soft hover:border-shu hover:text-shu"
                }`}
              >
                {item.name}
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
            このカテゴリの記事はまだありません。
          </p>
        )}
      </div>
    </>
  );
}
