"use client";

import CoverPlaceholder from "./CoverPlaceholder";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPostSummary } from "@/lib/microcms/types";
import { formatDate, optimizedImageUrl, toDateAttribute } from "@/lib/microcms/format";

/**
 * しおり画面「情報」タブ末尾に出す関連記事（Client Component）。
 *
 * queries.ts は server-only のため直接 import できない。
 * 記事の取得は必ず /api/blog/related を経由すること。
 *
 * 配置方針: 情報タブは予約情報の保管場所であり主動線ではないため、
 * ここに置いてもしおり作成フローを妨げない。この位置は維持すること。
 */
type RelatedArticlesProps = {
  /** しおりの目的地。空なら何も表示しない */
  destination?: string | null;
};

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ destination }) => {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const keyword = destination?.trim();
    if (!keyword) {
      setPosts([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/blog/related?destination=${encodeURIComponent(keyword)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data: { posts?: BlogPostSummary[] }) => {
        setPosts(data.posts ?? []);
      })
      .catch(() => {
        // 関連記事はおまけの情報なので、失敗しても情報タブ本体の表示は妨げない
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [destination]);

  // 読み込み中と0件のときはセクションごと出さない（情報タブを無駄に長くしないため）
  if (isLoading || posts.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">
              {destination}の旅行に役立つ記事
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">
              現地での移動や準備のヒント
            </p>
          </div>
          <Link
            href="/blog"
            className="flex-shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            もっと見る
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex gap-3 rounded-lg border border-gray-100 p-2 transition-colors hover:bg-gray-50 sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-auto sm:w-full sm:aspect-[16/9] sm:rounded-none">
                {post.coverImage ? (
                  <Image
                    src={optimizedImageUrl(post.coverImage.url, 400)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 64px, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <CoverPlaceholder categorySlug={post.categorySlug} categoryName={post.categoryName} variant="thumb" />
                )}
              </div>

              <div className="min-w-0 flex-1 sm:p-3">
                <p className="text-[11px] font-semibold text-emerald-700">
                  {post.categoryName}
                </p>
                <h4 className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-gray-900 group-hover:text-emerald-700 sm:text-sm">
                  {post.title}
                </h4>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400">
                  <time dateTime={toDateAttribute(post.publishedAt)}>
                    {formatDate(post.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>約{post.readingMinutes}分</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedArticles;
