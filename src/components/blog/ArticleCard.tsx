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

/**
 * 記事カード。旅のノートに写真を貼ったような見た目にしている。
 *
 * 傾けるのは写真の枠だけにして、文字はまっすぐ読めるようにする。
 * 傾きの向きは一覧側（.blog-card-grid）で並び順から決める。
 */
const ArticleCard: React.FC<ArticleCardProps> = ({ post, featured = false }) => {
  const readingMinutes = estimateReadingMinutes(post.body);

  return (
    <article className={`group h-full ${featured ? "md:col-span-2" : ""}`}>
      <Link
        href={`/blog/${post.slug}`}
        className={`flex h-full flex-col ${featured ? "md:grid md:grid-cols-2 md:items-center md:gap-10" : ""}`}
      >
        <div className="blog-photo-frame relative bg-paper-card p-2 shadow-[0_1px_0_var(--color-rule),0_10px_24px_rgba(60,40,20,0.10)] transition-[rotate] duration-300">
          {/* マスキングテープ */}
          <span
            aria-hidden="true"
            className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-3 bg-[rgba(194,170,120,0.5)]"
          />
          <div className="relative aspect-[16/9] overflow-hidden bg-paper-deep">
            {post.coverImage ? (
              <Image
                src={optimizedImageUrl(post.coverImage.url, featured ? 1200 : 800)}
                alt=""
                fill
                sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
                className="object-cover"
              />
            ) : (
              <CoverPlaceholder categorySlug={post.category.slug} categoryName={post.category.name} variant="card" />
            )}
          </div>
        </div>

        <div className={`flex flex-1 flex-col px-1 pt-5 ${featured ? "md:pt-0" : ""}`}>
          <span className="inline-flex -rotate-2 self-start border-[1.5px] border-shu px-2 py-0.5 text-xs font-bold text-shu">
            {post.category.name}
          </span>

          <h3
            className={`mt-3 font-mincho font-extrabold leading-snug text-ink underline-offset-4 group-hover:underline group-hover:decoration-shu ${
              featured ? "text-xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>

          <p
            className={`mt-2 flex-1 leading-relaxed text-ink-soft ${
              featured ? "text-sm md:text-base" : "line-clamp-3 text-sm"
            }`}
          >
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs tracking-wide text-ink-muted">
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
