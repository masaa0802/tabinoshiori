import CoverPlaceholder from "./CoverPlaceholder";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/microcms/types";
import {
  estimateReadingMinutes,
  formatDate,
  optimizedImageUrl,
  toDateAttribute,
} from "@/lib/microcms/format";

type ArticleCardProps = {
  post: BlogPost;
  /** 一覧の先頭など、大きく見せたいカード */
  featured?: boolean;
};

const ArticleCard: React.FC<ArticleCardProps> = ({ post, featured = false }) => {
  const readingMinutes = estimateReadingMinutes(post.body);

  return (
    <article
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
        featured ? "md:flex" : "flex flex-col h-full"
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={featured ? "md:flex md:w-full" : "flex flex-col h-full"}
      >
        <div
          className={`relative bg-gray-100 overflow-hidden ${
            featured ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"
          }`}
        >
          {post.coverImage ? (
            <Image
              src={optimizedImageUrl(post.coverImage.url, featured ? 1200 : 800)}
              alt=""
              fill
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <CoverPlaceholder categorySlug={post.category.slug} categoryName={post.category.name} variant="card" />
          )}
        </div>

        <div className={`p-5 flex flex-col flex-1 ${featured ? "md:w-1/2 md:p-8 md:justify-center" : ""}`}>
          <span className="inline-flex self-start items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {post.category.name}
          </span>

          <h3
            className={`mt-3 font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors ${
              featured ? "text-xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>

          <p
            className={`mt-2 text-gray-600 leading-relaxed flex-1 ${
              featured ? "text-sm md:text-base" : "text-sm line-clamp-3"
            }`}
          >
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <time dateTime={toDateAttribute(post.publishedAt)}>
              {formatDate(post.publishedAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span>約{readingMinutes}分で読めます</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ArticleCard;
