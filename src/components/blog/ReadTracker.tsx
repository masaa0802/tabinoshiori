"use client";

import { useEffect, useRef } from "react";
import { trackArticleRead } from "@/lib/blog-analytics";

/**
 * 記事が読まれたかを測る。
 *
 * 滞在時間だけだと、開いたまま放置された場合と区別できない。
 * 本文の終わりに置いた目印が画面に入ったかどうかで判定する。
 *
 * 1記事につき1回だけ送る。スクロールで行き来しても重複しない。
 */
type Props = {
  slug: string;
  category: string;
  readingMinutes: number;
};

export default function ReadTracker({ slug, category, readingMinutes }: Props) {
  const marker = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const target = marker.current;
    // IntersectionObserver が無い環境では計測を諦める。
    // 閲覧の妨げにはしない
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || sent.current) continue;
          sent.current = true;
          trackArticleRead({ slug, category, readingMinutes });
          observer.disconnect();
        }
      },
      // 目印が画面に少しでも入った時点で読了とみなす
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [slug, category, readingMinutes]);

  return <div ref={marker} aria-hidden className="h-px w-full" />;
}
