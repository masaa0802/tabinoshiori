"use client";

import Link from "next/link";
import { trackCtaClick, type CtaPosition } from "@/lib/blog-analytics";

/**
 * 旅程作成への導線。押されたことを記録する。
 *
 * 見た目は呼び出し側が className で決める。計測だけを足す薄い層なので、
 * 既存のCTAは Link をこれに差し替えるだけで済む。
 *
 * 記事ページから押された場合は slug を渡すこと。渡さないと
 * 「どの記事がユーザーを連れてきたか」が紐づかない。
 */
type Props = {
  position: CtaPosition;
  slug?: string;
  category?: string;
  className?: string;
  children: React.ReactNode;
};

export default function CtaLink({
  position,
  slug,
  category,
  className,
  children,
}: Props) {
  return (
    <Link
      href="/group/new"
      className={className}
      onClick={() => trackCtaClick({ slug, category, position })}
    >
      {children}
    </Link>
  );
}
