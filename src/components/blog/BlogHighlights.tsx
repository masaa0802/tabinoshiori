import CoverPlaceholder from "./CoverPlaceholder";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/microcms/queries";
import {
  estimateReadingMinutes,
  formatDate,
  optimizedImageUrl,
  toDateAttribute,
} from "@/lib/microcms/format";

/**
 * LP に差し込む新着記事セクション（Server Component）。
 *
 * 配置方針: ヒーローCTAより「下」、CTAセクションの直下に置く。
 * しおり作成の主動線に干渉させないため、この位置は維持すること。
 */
const HIGHLIGHT_COUNT = 3;

const BlogHighlights = async () => {
  const posts = (await getAllPosts()).slice(0, HIGHLIGHT_COUNT);

  if (posts.length === 0) return null;

  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              旅行の準備に役立つ記事
            </h2>
            <p className="mt-2 text-gray-600">
              持ち物の決め方から現地での移動まで、はじめての旅行でつまずきやすいところを解説しています。
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
          >
            記事をすべて見る
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
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {post.coverImage ? (
                  <Image
                    src={optimizedImageUrl(post.coverImage.url, 800)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <CoverPlaceholder categorySlug={post.category.slug} categoryName={post.category.name} variant="card" />
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {post.category.name}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                  <time dateTime={toDateAttribute(post.publishedAt)}>
                    {formatDate(post.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>約{estimateReadingMinutes(post.body)}分</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogHighlights;
